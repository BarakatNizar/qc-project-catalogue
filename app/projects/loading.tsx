
// app/loading.tsx

import FullPageLoader from "@/components/loaders/FullPageLoader";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";

export default async function  Loading() {
  const locale = await getCurrentApplicationLanguage();
  return <FullPageLoader label={locale==='en'?"Loading Projects...":"جاري تحميل المشاريع..."} />;
}