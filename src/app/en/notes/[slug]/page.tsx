import { NoteView, noteMetadata, noteStaticParams } from '@/views/BrowseViews';

export const revalidate = 300;

export async function generateStaticParams() {
  return noteStaticParams('en');
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return noteMetadata('en', slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <NoteView lang="en" slug={slug} />;
}
