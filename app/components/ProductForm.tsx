"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createProduct, updateProduct } from "@/lib/actions/adminActions"
import { Loader2, Plus, X, UploadCloud, Check } from "lucide-react"

interface ProductFormProps {
  categories: { _id: string; name: string }[]
  initialProduct?: {
    _id: string
    name: string
    brand: string
    price: number
    discount: number
    stock: number
    category: string
    description: string
    ingredients: string[]
    usageInstructions: string
    benefits: string[]
    tags: string[]
    skinType: string[]
    concernType: string[]
    isFeatured: boolean
    images: { public_id: string; secure_url: string; alt?: string }[]
  }
}

const SKIN_TYPES = ["all", "sensitive", "oily", "dry", "combination"]
const CONCERNS = ["acne", "anti-aging", "dark-spots", "dryness", "pores", "dullness", "redness", "wrinkles", "uneven-tone"]

export default function ProductForm({ categories, initialProduct }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form Fields
  const [name, setName] = useState(initialProduct?.name || "")
  const [brand, setBrand] = useState(initialProduct?.brand || "")
  const [price, setPrice] = useState(initialProduct?.price || 0)
  const [discount, setDiscount] = useState(initialProduct?.discount || 0)
  const [stock, setStock] = useState(initialProduct?.stock || 0)
  const [category, setCategory] = useState(initialProduct?.category || categories[0]?._id || "")
  const [description, setDescription] = useState(initialProduct?.description || "")
  const [ingredients, setIngredients] = useState(initialProduct?.ingredients?.join(", ") || "")
  const [usageInstructions, setUsageInstructions] = useState(initialProduct?.usageInstructions || "")
  const [benefits, setBenefits] = useState(initialProduct?.benefits?.join(", ") || "")
  const [tags, setTags] = useState(initialProduct?.tags?.join(", ") || "")
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false)

  // Array / selection states
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>(initialProduct?.skinType || ["all"])
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(initialProduct?.concernType || [])

  // Image Upload list
  const [images, setImages] = useState<{ public_id: string; secure_url: string; alt?: string }[]>(
    initialProduct?.images || []
  )
  const [isUploading, setIsUploading] = useState(false)
  const [formError, setFormError] = useState("")

  // Toggle Selection helpers
  function toggleSkinType(type: string) {
    setSelectedSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  function toggleConcern(concern: string) {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    )
  }

  // Cloudinary image upload handler
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setFormError("")

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/cloudinary", {
          method: "POST",
          body: formData
        })

        const data = await res.json()
        if (data.error) {
          setFormError(data.error)
        } else {
          setImages((prev) => [
            ...prev,
            { public_id: data.public_id, secure_url: data.secure_url, alt: name }
          ])
        }
      } catch (err) {
        setFormError("Failed to upload image to Cloudinary.")
      }
    }
    setIsUploading(false)
  }

  // Cloudinary image removal handler
  async function handleRemoveImage(publicId: string) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/cloudinary", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: publicId })
        })
        const data = await res.json()
        if (data.success) {
          setImages((prev) => prev.filter((img) => img.public_id !== publicId))
        } else {
          setFormError(data.error || "Failed to delete image.")
        }
      } catch (err) {
        setFormError("Failed to communicate with image deletion service.")
      }
    })
  }

  // Form submit coordinator
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    if (images.length === 0) {
      setFormError("At least one product image is required.")
      return
    }

    const payload = {
      name,
      brand,
      price: Number(price),
      discount: Number(discount),
      stock: Number(stock),
      category,
      description,
      ingredients: ingredients.split(",").map((s) => s.trim()).filter(Boolean),
      usageInstructions,
      benefits: benefits.split(",").map((s) => s.trim()).filter(Boolean),
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      skinType: selectedSkinTypes,
      concernType: selectedConcerns,
      isFeatured,
      images
    }

    startTransition(async () => {
      const isEdit = !!initialProduct?._id
      const res = isEdit
        ? await updateProduct(initialProduct!._id, payload)
        : await createProduct(payload)

      if (res.success) {
        router.push("/admin/products")
        router.refresh()
      } else {
        setFormError(res.error || "Failed to persist formulation details.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Left 2 Columns: Core Form values */}
      <div className="lg:col-span-2 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
        
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Title</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="e.g. Encapsulated Retinol Care" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Brand Name</label>
            <input required type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="e.g. LumiSkin" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Base Price ($)</label>
            <input required type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Discount (%)</label>
            <input required type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Stock Quantity</label>
            <input required type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Assign Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold">
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
          <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="Extensive product narrative..." />
        </div>

        {/* Skincare specific details */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Formulation Specifications</h4>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ingredients (Comma Separated)</label>
            <input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="Glycerin, Hyaluronic Acid, Water..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Benefits (Comma Separated)</label>
              <input type="text" value={benefits} onChange={(e) => setBenefits(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="Deep Hydration, Soothing, Anti-Aging..." />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Search Tags (Comma Separated)</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="spf, sun protection, oil-free..." />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Directions / Usage Instructions</label>
            <textarea rows={3} value={usageInstructions} onChange={(e) => setUsageInstructions(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" placeholder="e.g. Apply evenly to face and neck morning and evening..." />
          </div>
        </div>

      </div>

      {/* Right Column: Images upload + targets + submit */}
      <div className="space-y-6">
        
        {/* IMAGE UPLOADS */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Cloudinary Images</h3>

          {/* Upload Button */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-1.5 text-xs text-slate-400">
              <UploadCloud className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-600">Click to upload files</p>
              <p>Supports PNG, JPG (Max 5MB)</p>
            </div>
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading image files to Cloudinary...
            </div>
          )}

          {/* Uploaded thumbnails */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {images.map((img) => (
                <div key={img.public_id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <img src={img.secure_url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.public_id)}
                    className="absolute top-1 right-1 p-1 bg-white/95 rounded-full border border-slate-200 text-slate-500 hover:text-red-500 shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TARGET SELECTIONS (Skin Type & Concerns) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          
          {/* Skin types */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Skin Types</h4>
            <div className="flex flex-wrap gap-1.5">
              {SKIN_TYPES.map((type) => {
                const isActive = selectedSkinTypes.includes(type)
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleSkinType(type)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all capitalize font-semibold ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Concerns */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Addressed Skin Concerns</h4>
            <div className="flex flex-wrap gap-1.5">
              {CONCERNS.map((c) => {
                const isActive = selectedConcerns.includes(c)
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleConcern(c)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all capitalize font-semibold ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {c.replace("-", " ")}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <input
              id="isFeatured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700">Set as Featured Best Seller</label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm disabled:bg-slate-200 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Formulation...
              </>
            ) : (
              <>
                <Check className="w-4.5 h-4.5" /> Save formulation Card
              </>
            )}
          </button>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-semibold">
              Error: {formError}
            </div>
          )}
        </div>

      </div>

    </form>
  )
}
