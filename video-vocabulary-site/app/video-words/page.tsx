import type { Metadata } from "next";
import VideoWordLibrary from "./VideoWordLibrary";

export const metadata: Metadata = {
  title: "Complete Video Vocabulary Word List",
  description: "545 vocabulary words extracted frame by frame, with concise English meanings, simple examples, and estimated grade levels.",
  openGraph: {
    title: "Complete Video Vocabulary Word List",
    description: "545 frame-by-frame vocabulary words with short meanings, examples, and grade levels.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Complete Video Vocabulary Word List",
    description: "545 frame-by-frame vocabulary words with short meanings, examples, and grade levels.",
    images: [],
  },
};

export default function VideoWordsPage() {
  return <VideoWordLibrary />;
}
