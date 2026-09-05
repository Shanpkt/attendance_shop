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

const normalizeStoragePath = (publicUrl, storagePath) => {
  const rawPath =
    storagePath ||
    getStoragePathFromPublicUrl(publicUrl);

  return String(rawPath || "")
    .replace(new RegExp(`^${STORAGE_BUCKET}/`), "")
    .replace(/^\/+/, "");
};

const isFileStillPublic = async (publicUrl) => {
  if (!publicUrl) {
    return false;
  }

  try {
    const response = await fetch(
      `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Selfie existence check failed:", error);
    return false;
  }
};

const deleteViaBackend = async (publicUrl, path) => {
  const response = await fetch(
    "https://attendance-backend-hs75.onrender.com/api/attendance/selfie",
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selfieUrl: publicUrl,
        path,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Backend could not delete the selfie."
    );
  }

  return data;
};

export const deleteAttendanceImage = async (
  publicUrl,
  storagePath
) => {
  const path = normalizeStoragePath(
    publicUrl,
    storagePath
  );

  if (!path) {
    throw new Error("Selfie path is missing.");
  }

  let backendDeleted = false;

  try {
    await deleteViaBackend(publicUrl, path);
    backendDeleted = true;
  } catch (error) {
    console.error("Backend selfie delete error:", error);
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Supabase delete error:", error);
  }

  const removed =
    Array.isArray(data) &&
    data.some(
      (item) =>
        item?.name === path ||
        item?.name?.endsWith(path.split("/").pop())
    );

  const stillExists = await isFileStillPublic(publicUrl);

  if (stillExists && !backendDeleted && !removed) {
    throw new Error(
      "Supabase did not delete the selfie. Storage delete permission is missing."
    );
  }

  if (stillExists) {
    throw new Error(
      "The selfie is still in Supabase. Please try again."
    );
  }
};
