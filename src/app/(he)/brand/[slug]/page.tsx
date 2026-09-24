import { BrandView, brandMetadata, brandStaticParams } from '@/views/BrowseViews';

export const revalidate = 300;

export async function generateStaticParams() {
  return brandStaticParams();
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return brandMetadata('he', slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <BrandView lang="he" slug={slug} />;
}
