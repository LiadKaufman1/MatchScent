import PerfumeView, { perfumeMetadata, perfumeStaticParams } from '@/views/PerfumeView';

export const revalidate = 300;

export async function generateStaticParams() {
  return perfumeStaticParams();
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return perfumeMetadata('en', slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <PerfumeView lang="en" slug={slug} />;
}
