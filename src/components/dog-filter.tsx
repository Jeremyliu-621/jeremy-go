/**
 * Snapchat-style dog filter overlay using the actual PNG asset.
 * Render inside a `position: relative; overflow: hidden` container that holds the photo.
 */
export default function DogFilter() {
  return (
    <img
      src="/dog-filter.png"
      alt=""
      className="pointer-events-none absolute z-10"
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  );
}
