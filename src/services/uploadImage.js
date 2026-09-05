import { supabase } from "../config/supabase";

const STORAGE_BUCKET = "ATTENDANCE";

const dataUrlToBlob = async (image) => {
  if (!image || typeof image !== "string") {
    throw new Error("Selfie image is missing.");
  }

  if (image.startsWith("blob:")) {
    const response = await fetch(image);
    return response.blob();
  }

  const parts = image.split(",");

  if (parts.length < 2) {
    throw new Error("Invalid selfie image.");
  }

  const mimeMatch = parts[0].match(/data:(.*?);/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
};

export const uploadAttendanceImage = async (
  base64Image,
  mobileNumber
) => {
  const blob = await dataUrlToBlob(base64Image);

  const folder = /^\d{10}$/.test(mobileNumber || "")
    ? mobileNumber
    : "pending";

  const fileName = `${folder}/${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(
      error.message || "Unable to upload selfie to storage."
    );
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error("Selfie uploaded but no public URL was returned.");
  }

  return {
    publicUrl: urlData.publicUrl,
    path: data.path,
  };
};

const getStoragePathFromPublicUrl = (publicUrl) => {
  if (!publicUrl) {
    return "";
  }

  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) {
    return "";
  }

  return decodeURIComponent(
    publicUrl.slice(index + marker.length).split("?")[0]
  );
};

export const deleteAttendanceImage = async (
  publicUrl,
  storagePath
) => {
  const path =
    storagePath ||
    getStoragePathFromPublicUrl(publicUrl);

  if (!path) {
    throw new Error("Selfie path is missing.");
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Supabase delete error:", error);
    throw new Error(
      error.message || "Unable to delete selfie from storage."
    );
  }
};
