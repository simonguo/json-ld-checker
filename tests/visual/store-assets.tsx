import ReactDOM from 'react-dom/client';
import {
  Bot,
  Braces,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  SearchCode,
} from 'lucide-react';
import '../../src/index.css';

type ScreenshotView = 'inspector' | 'issues' | 'assist' | 'settings';
type AssetName =
  | 'screenshot-inspector'
  | 'screenshot-issues'
  | 'screenshot-ai'
  | 'screenshot-settings'
  | 'promo-small'
  | 'promo-marquee';

const asset = (
  new URLSearchParams(window.location.search).get('asset') || 'screenshot-inspector'
) as AssetName;

document.documentElement.style.cursor = 'none';
document.body.style.cursor = 'none';

const screenshots: Record<
  Exclude<AssetName, 'promo-small' | 'promo-marquee'>,
  {
    eyebrow: string;
    title: string;
    description: string;
    points: string[];
    view: ScreenshotView;
  }
> = {
  'screenshot-inspector': {
    eyebrow: 'INSPECTOR',
    title: 'Structured data,\ninspected like code.',
    description:
      'Read every JSON-LD block in a compact tree or source view without leaving the page.',
    points: ['Tree + source views', 'Search, copy, export', 'Multiple schemas'],
    view: 'inspector',
  },
  'screenshot-issues': {
    eyebrow: 'ISSUES',
    title: 'Fix the field,\nnot just the error.',
    description:
      'See severity, guidance and the exact JSONPath. Jump straight back to the failing node.',
    points: ['Precise JSONPath', 'Severity filters', 'One-click navigation'],
    view: 'issues',
  },
  'screenshot-ai': {
    eyebrow: 'AI TOOLS',
    title: 'AI when useful.\nLocal first, always.',
    description:
      'Review existing markup or draft a starting point with the provider you already trust.',
    points: ['Review current markup', 'Generate local drafts', 'Bring your own key'],
    view: 'assist',
  },
  'screenshot-settings': {
    eyebrow: 'MODEL PROVIDERS',
    title: 'Works with the\nmodels you choose.',
    description:
      'Configure global and Chinese providers, local Ollama, or any OpenAI-compatible endpoint.',
    points: ['Global + China providers', 'Custom endpoints', 'Local Ollama'],
    view: 'settings',
  },
};

function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={[
        'flex h-10 w-10 items-center justify-center rounded-[8px] border',
        dark
          ? 'border-white/25 bg-white/10 text-white'
          : 'border-[#b7dfc0] bg-white text-[#1a7f37]',
      ].join(' ')}
    >
      <Braces size={23} strokeWidth={2.3} />
    </div>
  );
}

function SitePreview() {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8fafb]">
      <div className="border-b border-[#e4e8ec] bg-white px-5 py-4">
        <div className="mb-3 h-2 w-16 rounded bg-[#dce3e8]" />
        <div className="h-5 w-52 rounded bg-[#202124]" />
        <div className="mt-2 h-2.5 w-64 rounded bg-[#c8d0d7]" />
      </div>
      <div className="grid flex-1 gap-4 p-5">
        <div className="rounded-[7px] border border-[#e1e5ea] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-[7px] bg-[#e8f3eb]" />
            <div className="flex-1">
              <div className="h-3 w-3/4 rounded bg-[#59636e]" />
              <div className="mt-2 h-2 w-full rounded bg-[#d8dee4]" />
              <div className="mt-1.5 h-2 w-5/6 rounded bg-[#d8dee4]" />
              <div className="mt-3 h-7 w-24 rounded bg-[#1a7f37]" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[7px] border border-[#e1e5ea] bg-white p-4">
            <div className="h-2.5 w-16 rounded bg-[#59636e]" />
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded bg-[#e1e5ea]" />
              <div className="h-2 w-5/6 rounded bg-[#e1e5ea]" />
              <div className="h-2 w-2/3 rounded bg-[#e1e5ea]" />
            </div>
          </div>
          <div className="rounded-[7px] border border-[#e1e5ea] bg-white p-4">
            <div className="h-2.5 w-20 rounded bg-[#59636e]" />
            <div className="mt-3 font-mono text-[8px] leading-4 text-[#1a7f37]">
              {'{ "@type": "Product" }'}
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_31px,#eef1f4_32px)] bg-[size:32px_32px] opacity-30" />
    </div>
  );
}

function BrowserWindow({
  view,
  compact = false,
}: {
  view: ScreenshotView;
  compact?: boolean;
}) {
  const isSettings = view === 'settings';
  const source = isSettings
    ? '/tests/visual/settings.html'
    : `/tests/visual/sidepanel.html?view=${view}`;

  return (
    <div
      className={[
        'h-full overflow-hidden border border-[#bcc5ce] bg-white shadow-[0_20px_50px_rgba(20,45,30,0.18)]',
        compact ? 'rounded-[9px]' : 'rounded-[12px]',
      ].join(' ')}
    >
      <div className="flex h-10 items-center gap-2 border-b border-[#c7d1e0] bg-[#edf1f7] px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d86b64]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d6a63b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#50a566]" />
        <div className="ml-2 flex h-6 min-w-0 flex-1 items-center rounded-[4px] border border-[#c7d1e0] bg-white px-2 font-mono text-[8px] text-[#69737d]">
          developer.example/keyboards/dev-75
        </div>
        <div className="flex h-6 w-6 items-center justify-center text-[#69737d]">
          <CircleDot size={13} />
        </div>
      </div>

      {isSettings ? (
        <iframe
          title="JSON-LD Checker settings"
          src={source}
          className="block w-full border-0 bg-white"
          style={{ height: 'calc(100% - 40px)' }}
        />
      ) : (
        <div className="flex min-h-0" style={{ height: 'calc(100% - 40px)' }}>
          {!compact && <SitePreview />}
          <iframe
            title={`JSON-LD Checker ${view}`}
            src={source}
            className={[
              'block flex-none border-0 border-l border-[#c7d1e0] bg-white',
              compact ? 'h-full w-full' : 'h-full w-[430px]',
            ].join(' ')}
          />
        </div>
      )}
    </div>
  );
}

function ScreenshotCanvas({
  name,
}: {
  name: Exclude<AssetName, 'promo-small' | 'promo-marquee'>;
}) {
  const item = screenshots[name];
  return (
    <div className="relative h-[800px] w-[1280px] overflow-hidden bg-[#eef7f0] text-[#16231a]">
      <div className="absolute inset-y-0 left-0 w-2 bg-[#1a7f37]" />
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[44px] border-[#d9edde]" />
      <div className="absolute bottom-[-160px] left-44 h-72 w-72 rounded-full border-[38px] border-white/70" />

      <section className="absolute left-16 top-16 z-10 w-[360px]">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.01em] text-[#1f2328]">
              JSON-LD Checker
            </div>
            <div className="font-mono text-[10px] text-[#59636e]">
              Developer tools for structured data
            </div>
          </div>
        </div>

        <div className="mt-16 font-mono text-[12px] font-semibold tracking-[0.16em] text-[#1a7f37]">
          {item.eyebrow}
        </div>
        <h1 className="mt-4 whitespace-pre-line text-[45px] font-semibold leading-[1.08] tracking-[-0.045em] text-[#142219]">
          {item.title}
        </h1>
        <p className="mt-5 max-w-[330px] text-[16px] leading-7 text-[#4d6254]">
          {item.description}
        </p>

        <ul className="mt-8 space-y-3">
          {item.points.map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-[13px] font-medium text-[#294731]">
              <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#d8efdd] text-[#1a7f37]">
                <Check size={13} strokeWidth={2.5} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <div
        className={[
          'absolute right-12 top-[62px] h-[676px]',
          item.view === 'settings' ? 'w-[790px]' : 'w-[800px]',
        ].join(' ')}
      >
        <BrowserWindow view={item.view} />
      </div>
    </div>
  );
}

function SmallPromo() {
  return (
    <div className="relative h-[280px] w-[440px] overflow-hidden bg-[#1a7f37] text-white">
      <div className="absolute -left-14 -top-20 h-52 w-52 rounded-full border-[30px] border-white/10" />
      <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full border-[26px] border-[#0f6529]/45" />
      <div className="absolute left-7 top-7 z-10 w-[230px]">
        <BrandMark dark />
        <h1 className="mt-5 text-[29px] font-semibold leading-none tracking-[-0.035em]">
          JSON-LD Checker
        </h1>
        <p className="mt-3 text-[15px] font-medium text-white/90">
          Inspect. Validate. Ship.
        </p>
        <div className="mt-7 flex items-center gap-2 font-mono text-[9px] text-white/75">
          <span>INSPECTOR</span>
          <span className="h-1 w-1 rounded-full bg-white/45" />
          <span>ISSUES</span>
          <span className="h-1 w-1 rounded-full bg-white/45" />
          <span>AI TOOLS</span>
        </div>
      </div>

      <div className="absolute left-[277px] top-6 h-[232px] w-[142px] overflow-hidden rounded-[8px] border border-white/30 bg-white shadow-[0_16px_30px_rgba(6,64,25,0.28)]">
        <div className="h-[392px] w-[240px] origin-top-left scale-[0.59]">
          <BrowserWindow view="issues" compact />
        </div>
      </div>
    </div>
  );
}

function MarqueePromo() {
  const features = [
    { icon: SearchCode, label: 'Inspect every schema' },
    { icon: Code2, label: 'Navigate exact JSONPath' },
    { icon: Bot, label: 'Optional AI tools' },
  ];

  return (
    <div className="relative h-[560px] w-[1400px] overflow-hidden bg-[#1a7f37] text-white">
      <div className="absolute inset-y-0 left-[640px] w-px bg-white/15" />
      <div className="absolute -left-32 -top-52 h-[470px] w-[470px] rounded-full border-[70px] border-white/[0.07]" />
      <div className="absolute -bottom-56 left-[470px] h-[430px] w-[430px] rounded-full border-[62px] border-[#0c6125]/35" />
      <div className="absolute right-10 top-5 font-mono text-[110px] leading-none text-white/[0.035]">
        {'{ }'}
      </div>

      <section className="absolute left-[82px] top-[72px] z-10 w-[500px]">
        <div className="flex items-center gap-3">
          <BrandMark dark />
          <span className="font-mono text-[12px] tracking-[0.13em] text-white/70">
            CHROME DEVTOOLS FOR JSON-LD
          </span>
        </div>
        <h1 className="mt-9 text-[58px] font-semibold leading-[1.02] tracking-[-0.05em]">
          Structured data,
          <br />
          inspected like code.
        </h1>
        <p className="mt-6 max-w-[450px] text-[20px] leading-8 text-white/[0.82]">
          Inspect schemas, resolve issues and draft improvements without leaving the page.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[12px] font-medium text-white/85">
              <Icon size={14} />
              {label}
            </div>
          ))}
        </div>
        <div className="mt-9 inline-flex h-9 items-center gap-2 rounded-[5px] border border-white/30 bg-white/10 px-3 text-[12px] font-semibold">
          Open source · Privacy first
          <ChevronRight size={14} />
        </div>
      </section>

      <div className="absolute right-[70px] top-[48px] h-[464px] w-[650px]">
        <BrowserWindow view="inspector" />
      </div>
    </div>
  );
}

function StoreAsset() {
  if (asset === 'promo-small') return <SmallPromo />;
  if (asset === 'promo-marquee') return <MarqueePromo />;
  return <ScreenshotCanvas name={asset} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<StoreAsset />);
