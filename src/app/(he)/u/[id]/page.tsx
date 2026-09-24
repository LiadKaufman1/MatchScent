import ProfileView, { profileMetadata } from '@/views/ProfileView';

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return profileMetadata('he', id);
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProfileView lang="he" id={id} />;
}
