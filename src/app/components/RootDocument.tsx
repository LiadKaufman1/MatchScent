import { heebo } from '@/lib/fonts';
import { getDict, type Lang } from '@/lib/i18n';
import '../globals.css';
import A11yWidget from './A11yWidget';

// Applies the visitor's saved accessibility settings before the page is painted, so
// the page does not flash at the default size first.
const A11Y_BOOTSTRAP = `try{var s=JSON.parse(localStorage.getItem('ms_a11y')||'{}'),d=document.documentElement;['size','contrast','links','readable','still'].forEach(function(k){if(s[k])d.setAttribute('data-a11y-'+k,String(s[k]))})}catch(e){}`;

// The <html> and <body> of every page. English, Hebrew and the admin each use it.
export default function RootDocument({
  lang,
  children,
  accessibility = true,
}: {
  lang: Lang;
  children: React.ReactNode;
  accessibility?: boolean;
}) {
  const t = getDict(lang);
  return (
    <html lang={lang} dir={t.dir} suppressHydrationWarning>
      <body className={`${heebo.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP }} />
        {children}
        {accessibility && <A11yWidget lang={lang} />}
      </body>
    </html>
  );
}
