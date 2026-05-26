import { ProjetoArteStorefront } from "./_components/projeto-arte-storefront";
import { listCategories, listProducts } from "@/lib/proj-arte/store";
import { getContactConfig, getPublicUrl, getStripeConfig } from "@/lib/proj-arte/env";

export default async function HomePage() {
  const [initialCategories, initialProducts] = await Promise.all([
    listCategories(),
    listProducts({ onlyActive: true, limit: 1000 }),
  ]);

  return (
    <ProjetoArteStorefront
      initialCategories={initialCategories}
      initialProducts={initialProducts.data}
      publicUrl={getPublicUrl()}
      whatsappUrl={getContactConfig().whatsappUrl}
      stripePublishableKey={getStripeConfig().publishableKey}
    />
  );
}
