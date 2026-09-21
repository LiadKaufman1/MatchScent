// Tells the browser which country the visitor is in, using the country Vercel
// works out from the visitor's connection. Nothing is stored or logged.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country');
  return Response.json(
    { country: country || null },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
