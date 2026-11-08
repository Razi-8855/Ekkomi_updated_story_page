import type { ShopifyImage } from "@/lib/shopify-storefront";

export default function ProductGallery({ images, productName }: { images: ShopifyImage[]; productName: string }) {
  const activeImage = images[0];

  if (!activeImage) {
    return <div className="product-gallery__empty" role="img" aria-label={`${productName} image unavailable`}>EKKOMI</div>;
  }

  return (
    <div className="product-gallery">
      <figure className="product-gallery__main">
        <img src={activeImage.url} alt={activeImage.altText || `${productName} jacket`} fetchPriority="high" />
      </figure>
    </div>
  );
}
