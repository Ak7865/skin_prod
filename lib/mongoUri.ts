import dns from "node:dns"

const DNS_SERVERS = ["1.1.1.1", "8.8.8.8"]

try {
  dns.setServers(DNS_SERVERS)
} catch (error) {
  console.warn("Warning: Failed to set custom DNS servers for MongoDB connection:", error)
}

let resolvedUriPromise: Promise<string> | null = null

function appendTxtOptions(target: URLSearchParams, txtRecords: string[][]) {
  for (const record of txtRecords) {
    const params = new URLSearchParams(record.join(""))
    for (const [key, value] of params.entries()) {
      if (!target.has(key)) {
        target.set(key, value)
      }
    }
  }
}

export async function getResolvedMongoUri(rawUri: string): Promise<string> {
  if (!rawUri.startsWith("mongodb+srv://")) {
    return rawUri
  }

  if (!resolvedUriPromise) {
    resolvedUriPromise = (async () => {
      const url = new URL(rawUri)
      const srvHostname = `_mongodb._tcp.${url.hostname}`
      const srvRecords = await dns.promises.resolveSrv(srvHostname)
      const txtRecords = await dns.promises.resolveTxt(url.hostname).catch(() => [])

      const credentials = url.username
        ? `${encodeURIComponent(decodeURIComponent(url.username))}:${encodeURIComponent(decodeURIComponent(url.password))}@`
        : ""

      const hosts = srvRecords
        .map((record) => `${record.name}:${record.port}`)
        .join(",")

      const params = new URLSearchParams(url.search)
      appendTxtOptions(params, txtRecords)
      if (!params.has("tls")) {
        params.set("tls", "true")
      }

      const pathname = url.pathname && url.pathname !== "/" ? url.pathname : ""
      const query = params.toString()

      return `mongodb://${credentials}${hosts}${pathname}${query ? `?${query}` : ""}`
    })()
  }

  return resolvedUriPromise
}
