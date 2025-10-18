// utils/videoAudio.ts
// import { FFmpegKit, ReturnCode } from "@ffmpeg-kit/react-native";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Izvlači audio track iz video fajla
 * @param videoUri - URI videa (file:// ili content://)
 * @returns URI ekstraktovanog audio fajla
 */
export async function extractAudioFromVideo(videoUri: string): Promise<string> {
  try {
    console.log("🎬 [extractAudio] Starting extraction from:", videoUri);

    // Generiši output putanju za audio
    const timestamp = Date.now();
    const outputUri = `${FileSystem.cacheDirectory}audio_${timestamp}.m4a`;

    console.log("🎬 [extractAudio] Output will be:", outputUri);

    // FFmpeg komanda za ekstrakciju audio tracka
    const command = `-i "${videoUri}" -vn -acodec copy "${outputUri}"`;

    // Izvršava FFmpeg komandu
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      console.log("🎬 [extractAudio] Success! Audio extracted to:", outputUri);

      // Proveri da li fajl postoji
      const fileInfo = await FileSystem.getInfoAsync(outputUri);
      if (!fileInfo.exists) {
        throw new Error("Audio fajl nije kreiran");
      }

      console.log("🎬 [extractAudio] File size:", fileInfo.size, "bytes");
      return outputUri;
    } else {
      const logs = await session.getOutput();
      console.error("🎬 [extractAudio] FFmpeg failed:", logs);
      throw new Error("Ekstrakcija audio nije uspela");
    }
  } catch (error) {
    console.error("🎬 [extractAudio] Error:", error);
    throw error;
  }
}
