import type { WidgetType } from "@shared/types/firestore-schema.ts";
import { ClockWidget } from "./widgets/ClockWidget.tsx";
import { TickerWidget } from "./widgets/TickerWidget.tsx";
import { WeatherWidget } from "./widgets/WeatherWidget.tsx";
import { RssWidget } from "./widgets/RssWidget.tsx";
import { YoutubeWidget } from "./widgets/YoutubeWidget.tsx";
import { WebpageWidget } from "./widgets/WebpageWidget.tsx";
import { QrCodeWidget } from "./widgets/QrCodeWidget.tsx";
import { CountdownWidget } from "./widgets/CountdownWidget.tsx";
import { GoogleSlidesWidget } from "./widgets/GoogleSlidesWidget.tsx";
import { SocialMediaWidget } from "./widgets/SocialMediaWidget.tsx";

interface WidgetRendererProps {
  widgetType: WidgetType;
  config?: Record<string, unknown>;
}

export function WidgetRenderer({ widgetType, config }: WidgetRendererProps) {
  switch (widgetType) {
    case "clock":
      return <ClockWidget config={config} />;
    case "ticker":
      return <TickerWidget config={config} />;
    case "weather":
      return <WeatherWidget config={config} />;
    case "rss":
      return <RssWidget config={config} />;
    case "youtube":
      return <YoutubeWidget config={config} />;
    case "webpage":
      return <WebpageWidget config={config} />;
    case "qrcode":
      return <QrCodeWidget config={config} />;
    case "countdown":
      return <CountdownWidget config={config} />;
    case "google-slides":
      return <GoogleSlidesWidget config={config} />;
    case "social-media":
      return <SocialMediaWidget config={config} />;
    default:
      return (
        <div className="flex items-center justify-center w-full h-full text-white text-lg">
          Widget: {widgetType}
        </div>
      );
  }
}
