import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories, getProductById } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Edit product</h1>
      <p className="mt-1 text-sm text-ink-500">{product.name}</p>
      <div className="mt-6">
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
