import { tenantConfig } from '@storefront/config';
import { apiFetch } from '@/lib/api';

interface Banner {
  id:               string;
  content:          string;
  linkUrl:          string | null;
  linkText:         string | null;
  backgroundColour: string | null;
  textColour:       string | null;
}

async function getTopStripBanners(): Promise<Banner[]> {
  try {
    return await apiFetch<Banner[]>('/banners?type=top_strip', {
      next: { revalidate: 60 },
    });
  } catch {
    return [];
  }
}

export async function TopStrip() {
  const banners = await getTopStripBanners();
  if (banners.length === 0) return null;

  // Show the first active banner — cycling is a client enhancement (future)
  const banner = banners[0];

  return (
    <div
      className="w-full py-2 px-4 text-center text-sm font-medium"
      style={{
        backgroundColor: banner.backgroundColour ?? tenantConfig.theme.primaryColor,
        color:           banner.textColour        ?? '#ffffff',
      }}
    >
      <span dangerouslySetInnerHTML={{ __html: banner.content }} />
      {banner.linkUrl && (
        
       <a   href={banner.linkUrl}
          className="ml-3 underline underline-offset-2 hover:no-underline"
        >
          {banner.linkText ?? 'Learn more'}
        </a>
      )}
    </div>
  );
}