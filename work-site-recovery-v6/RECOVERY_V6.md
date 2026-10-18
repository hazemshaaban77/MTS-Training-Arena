# MTS Training Arena — Version 6 source recovery

هذه نسخة سورس الإصدار السادس المنشور على Work/Sites، مستقلة عن الإصدار الخامس والمشروع القديم. تم نقل **178 ملف سورس أصليًا دون أي تعديل في محتواها أو صلاحية تنفيذها**، وإضافة هذا الدليل وملف الجرد وأداة التحقق فقط. لا يمثل هذا المجلد نسخة من بيانات المستخدمين الحية.

## إثبات الإصدار

| الحقل | القيمة |
| --- | --- |
| إصدار Sites | **6** |
| Source commit | `b8162e4e9cf9dcd0a440f9c13e98d481f9e3320d` |
| Source tree | راجع `source_tree_sha` في `RECOVERY_MANIFEST.json` |
| Site project | `appgprj_6ad0d979bf20819189d0f562dd8d47b3` |
| Saved version | `appgprj_6ad0d979bf20819189d0f562dd8d47b3~appgver_87bf757dbd0c81919d95f0c63325311e` |
| Deployment | `appgdep_6ad4a6b19c108191ae527d8ca376ebe6` — `succeeded` |
| وقت النشر UTC | `2026-10-18T11:00:17.760797+00:00` |
| الموقع الأصلي | https://mts-training-arena-private.rarehinny9.chatgpt.site |
| بصمة أرشيف النشر | `sha256:572fdb0a460a08a634b229ca1bf77abac6855ecdc663accbd529feccf8e1888e` |

تم تأكيد الربط بين سجل Version 6 وSource commit وحالة نشره عبر Sites قبل تجهيز هذه النسخة. بصمة أرشيف النشر تخص مخرجات البناء المحفوظة في Sites، وليست بصمة مجلد السورس هذا. بصمة كل ملف سورس موجودة في ملف الجرد.

يتضمن Version 6 تعديلَي تتبع المصادقة من فرع `fix/site-auth-network-tracing` ثم إصلاح `redirect: 'error'` غير المدعوم في Workers، باستعمال `manual` ورفض الاستجابات غير الناجحة. يشمل ذلك Google public signing keys وFirebase allowlist وعمليات تجهيز الحسابات الاختيارية. توجد اختبارات Workers المعزولة المضافة في الإصدار نفسه.

ملفات `README.md` و`docs/` الأصلية محفوظة كما كانت في Source commit؛ استخدم هذا الدليل لبيانات استرجاع Version 6 الحالية. تم تمرير 46 اختبارًا واختبار workerd للمصادقة قبل نشر هذا الـCommit. اختبارات الخدمات المعزولة ليست إثباتًا لتسجيل الدخول بحساب المالك أو اختبار أجهزة حقيقية.

## ما تم حفظه

- `app/` و`components/` و`lib/`: الواجهة، API، منطق الأنشطة، المصادقة، التقارير والصلاحيات.
- `public/`: الشعارات والخطوط والأصول المحلية الأصلية مع تراخيصها.
- `db/` و`drizzle/`: مخطط SQLite/D1 وستة migrations مرتبة من `0000` إلى `0005`، وملفات snapshots والجرد الخاص بها.
- `build/` و`scripts/` وملفات الإعداد: Worker entrypoint، تكامل Sites، التثبيت، البناء والتحقق.
- `package.json` و`pnpm-lock.yaml` وملفات TypeScript/Vite وغيرها: إعدادات التشغيل غير السرية.
- الاختبارات والوثائق ونسخة workflow الأصلية تحت هذا المجلد فقط. ملفات workflow المتداخلة ليست workflows فعالة في جذر المستودع.

`node_modules` ومخرجات البناء وGit metadata والحالة المحلية وملفات البيئة ليست سورسًا مطلوبًا للاسترجاع، ولم تُضمّن. ملفات البناء يعاد توليدها من lockfile والسورس. روابط HTTPS للصور والفيديو التي يضيفها المدرب تعتمد على بقاء تلك الخدمات متاحة؛ الأصول المحلية الموجودة في Git محفوظة كاملة.

## التحقق بعد التنزيل

استنسخ فرع `work-site-recovery-v6` ثم ادخل مجلد الإصدار، وليس جذر تطبيق GitHub Pages القديم:

```bash
git clone --branch work-site-recovery-v6 --single-branch https://github.com/hazemshaaban77/MTS-Training-Arena.git MTS-Training-Arena-v6
cd MTS-Training-Arena-v6/work-site-recovery-v6
node VERIFY_RECOVERED_SOURCE.mjs
```

الأداة تتحقق من الحجم وSHA-256 وGit blob SHA لكل ملف أصلي، ومن صلاحيات التنفيذ على الأنظمة التي تدعمها. الملفات الثلاثة الخاصة بالاسترجاع خارج قائمة السورس الأصلي ومذكورة منفصلة في الجرد.

## إعادة التشغيل محليًا

استخدم Node.js 24 وpnpm **11.25.0** المثبتة في `packageManager`، مع متطلبات النظام الخاصة بحزم workerd. على Windows يُفضّل WSL2/Linux. تثبيت pnpm يتم بالطريقة المعتمدة في بيئتك؛ إذا كانت Corepack متوفرة يمكنها استخدام نسخة pnpm المثبتة في المشروع.

من داخل `work-site-recovery-v6`:

```bash
pnpm --version
pnpm install --frozen-lockfile
node scripts/verify-arena.mjs
pnpm run build
```

الأوامر السابقة محلية ولا تنشر الموقع. في نسخة نظيفة، عدم وجود `.sites-runtime/execution-profile.json` يختار `portable` تلقائيًا؛ لا تنقل إعدادات جهاز Work المحلي. ناتج البناء يتضمن `dist/server/wrangler.json` وملفات العميل والـWorker.

لتجربة نسخة إنتاج محلية، هيّئ **قاعدة D1 محلية جديدة وفارغة فقط**. من نفس المجلد، طبّق ملفات SQL التالية مرة واحدة وبالترتيب؛ لا تطبّقها على قاعدة إنتاج قائمة أو قاعدة تحتوي بيانات مسترجعة:

```bash
for migration in drizzle/000[0-5]_*.sql; do
  pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file "$migration" || exit 1
done
pnpm run start
```

تحقق من نجاح جميع ملفات SQL قبل تشغيل التطبيق. `start` يستخدم `wrangler dev --local` ونفس مجلد الحالة `.wrangler/state`. مصدر إعداد Vite يستخدم معرف D1 افتراضيًا للبيئة المحلية؛ هذا ليس معرف قاعدة الإنتاج الفعلية. لا يوجد في هذه الخطوات `deploy` أو `--remote`.

## موارد الاستضافة غير الموجودة في Git

| المورد | المطلوب لإعادة التشغيل |
| --- | --- |
| Cloudflare Worker | Runtime متوافق مع Workers، تاريخ التوافق الأصلي `2026-05-15` و`nodejs_compat`، مع ناتج Vinext وstatic assets. يحفظ السورس نقطة الدخول `build/sites-worker.ts` وتكامل `sites()` كما هما. |
| D1 binding `DB` | قاعدة منفصلة للنسخة المسترجعة. migrations تعيد إنشاء البنية؛ استرجاع الجلسات واللاعبين والإجابات والمسودات والتقارير يتطلب SQL dump آمنًا من مالك بيئة الاستضافة. |
| R2 | غير مستخدمة في هذا الإصدار: `r2: null`. |
| Sites identity/access | الـSite الأصلي خاص بالمالك. سياسة الوصول وChatGPT gateway والنطاق والموارد المُدارة لا تُنسخ بواسطة Git. إعدادها يتم على منصة الاستضافة بصلاحيات صاحبها. |
| Firebase | المشروع العام المعرّف في `lib/firebase-config.ts` وحسابات المدربين وقواعد RTDB وallowlist، أو مشروع Firebase مستقل تُراجع إعداداته عند نقل الاستضافة. |

جداول D1 التطبيقية الاثنا عشر: `anonymous_responses`, `answers`, `audits`, `drafts`, `events`, `players`, `progress`, `rate_buckets`, `sessions`, `settings`, `trainer_links`, `trainer_profiles`.

لا توجد نسخة من صفوف الإنتاج أو أرقام الموظفين أو توكنات المشاركين أو أسرار الجلسات في هذا التصدير. واجهات Sites المتاحة لهذه المهمة لا تقدم تصدير SQL كاملًا، لذلك لم يتم عمل dump لقاعدة الإنتاج. لإعادة البيانات نفسها: اطلب تصديرًا آمنًا للبنية والبيانات من مالك بيئة D1، واحتفظ به خارج هذا المستودع العام، ثم استورده إلى قاعدة مستقلة. الأمر الرسمي `wrangler d1 export` يحتاج صلاحية للحساب والقاعدة الفعليين؛ معرف المشروع داخل `.openai/hosting.json` ليس بديلًا عن هذه الصلاحية أو معرف D1.

للاستضافة المستقلة خارج Sites، يلزم إعداد موارد Worker وD1 والأصول وسياسة الدخول، ومراجعة الاعتماد على هوية Sites في ربط الجلسات القديمة. GitHub Pages وحدها لا تشغّل هذا الـBackend. هذه النسخة لا تُنشئ أي استضافة جديدة ولا تغيّر نطاق الموقع الحالي.

## اتصال Firebase والأسرار

الإصدار يحفظ إعدادات Firebase العميل العامة لمشروع `mts-quiz-64faa` داخل `lib/firebase-config.ts`، بما فيها Firebase Web API key العام. هذه ليست كلمة مرور أو service-account private key. لا يتم إنشاء حساب Firebase أو تغيير قواعده عند استنساخ السورس.

تسجيل دخول المدرب يحتاج Email/Password مفعّلًا وحسابًا موجودًا وID token صحيحًا، مع سماح قراءة لقيمته `arenaV1/trainerAllowlist/<uid>` وأن تكون القيمة `true`. حافظ على قواعد الأمان وحقوق صاحب الحساب؛ لا تفتح قاعدة البيانات للعامة لتجاوز مشكلة إعداد. إعدادات موفر الدخول والحسابات وقواعد RTDB وبيانات allowlist الحية غير مُصدّرة هنا. إعدادات محاكيات/قواعد المشروع القديم في جذر المستودع ليست إثباتًا للقواعد المنشورة حاليًا في Firebase.

يلزم اتصال HTTPS من الـWorker إلى `www.googleapis.com` لجلب public signing keys وإلى `mts-quiz-64faa-default-rtdb.europe-west1.firebasedatabase.app` لفحص allowlist. تطبيق المتصفح يتصل بخدمات Firebase Authentication مثل `identitytoolkit.googleapis.com` و`securetoken.googleapis.com`، وفق إعدادات مشروع Firebase. تجهيز حسابات جديدة اختياري ويحتاج أيضًا إلى `oauth2.googleapis.com` و`identitytoolkit.googleapis.com`.

| الإعداد | الوضع في Version 6 وقت التصدير |
| --- | --- |
| Sites runtime environment | revision `0`، لا توجد أي runtime variables مهيأة. |
| `ARENA_ADMIN_UIDS` | غير مهيأ. قائمة UID للمديرين عند إعدادها من صاحب الصلاحية؛ لا تمنح أول دخول صلاحية Admin تلقائيًا. |
| `FIREBASE_SERVICE_ACCOUNT` | غير مهيأ. سرّ اختياري على السيرفر لتجهيز حسابات جديدة. ليس مطلوبًا للدخول المعتاد أو التحقق من توقيع ID token. |

احتفظ بأي أسرار لازمة لاحقًا في secret manager الخاص بالاستضافة أو ملف محلي غير متعقب. لا تنسخها إلى هذا المجلد ولا تضف ملفات بيئة حساسة إلى Git. لا تتضمن النسخة كلمات مرور، توكنات دخول، مفاتيح خاصة فعلية، بيانات اعتماد Sites، أو بيانات اعتماد دفع Git.

الانضمام داخل التطبيق للمتدرب لا يتطلب حساب Firebase؛ لكن بوابة الاستضافة الخاصة في Sites تطبق سياسة دخول ChatGPT قبل وصول المستخدم للتطبيق. تغيير تلك السياسة أو إتاحة دخول الضيوف إجراء استضافة منفصل لم يتم تنفيذه أثناء التصدير.

## الحفاظ على النسخ القائمة

الفرع الجديد مبني على `work-site-recovery` عند `543a40b59312df895d743ac752cbbf07458d4ba6` ويضيف هذا المجلد فقط. ملفات Version 5 داخل `work-site-recovery/` وكل ملفات المشروع القديم محفوظة ببصماتها. لم يُنفّذ merge أو دفع إلى `main`، ولم يُعد نشر الموقع.

`.openai/hosting.json` داخل هذا المجلد محفوظ حرفيًا لإثبات هوية الإصدار الأصلي. لا تستخدم هوية الموقع الأصلي لنشر تجربة استرجاع. إذا طُلب إنشاء استضافة مستقلة لاحقًا، سجّل مشروعًا جديدًا لها واضبط هويته وموارده هناك بوضوح. الحفاظ على هذا الملف في نسخة السورس لا يربط الفرع تلقائيًا باستضافة ولا يمنح أي صلاحيات نشر.

## مراجع التشغيل

- https://developers.cloudflare.com/d1/wrangler-commands/
- https://developers.cloudflare.com/d1/best-practices/local-development/
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/database/rest/auth
