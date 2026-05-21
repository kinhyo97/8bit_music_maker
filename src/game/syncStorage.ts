export const SYNC_OFFSET_STORAGE_KEY = "8bit-music-maker:sync-offset-ms";

/**
 * 로컬스토리지에 저장된 싱크 오프셋 값을 읽는다.
 * 저장값이 없거나 숫자가 아니면 0ms를 기본값으로 사용한다.
 */
export const readStoredSyncOffsetMs = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.localStorage.getItem(SYNC_OFFSET_STORAGE_KEY);
  const parsedValue = rawValue == null ? 0 : Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

/**
 * 현재 맞춘 싱크 오프셋 값을 로컬스토리지에 저장한다.
 */
export const writeStoredSyncOffsetMs = (offsetMs: number) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SYNC_OFFSET_STORAGE_KEY, String(offsetMs));
};
