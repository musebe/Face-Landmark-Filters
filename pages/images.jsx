import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import Link from "next/link";
import Image from "next/image";

export default function Images() {
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);

  const getImages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/images", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      setImages(data.result.resources);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

  const handleDownloadResource = async (url) => {
    try {
      setLoading(true);

      console.log(url);

      const response = await fetch(url, {});

      if (response.ok) {
        const blob = await response.blob();

        const fileUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = fileUrl;

        a.download = `face-landmark-filters.${url.split(".").at(-1)}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      throw await response.json();
    } catch (error) {
      // TODO: Show error message to user
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      getImages();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {images.length > 0 ? (
        <div className="wrapper">
          <div className="images-wrapper">
            {images.map((image) => {
              return (
                <div className="image-wrapper" key={image.public_id}>
                  <div className="image">
                    <Image
                      src={image.secure_url}
                      width={image.width}
                      height={image.height}
                      layout="responsive"
                      alt={image.secure_url}
                    ></Image>
                  </div>
                  <div className="actions">
                    <button
                      className="button"
                      disabled={loading}
                      onClick={() => {
                        handleDownloadResource(image.secure_url);
                      }}
                    >
                      Download
                    </button>
                    <button
                      className="button danger"
                      disabled={loading}
                      onClick={() => {
                        handleDelete(image.public_id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {!loading && images.length === 0 ? (
        <div className="no-images">
          <b>No Images Yet</b>
          <Link href="/">
            <a className="button">Upload some images</a>
          </Link>
        </div>
      ) : null}
      {loading && images.length === 0 ? (
        <div className="loading">
          <b>Loading...</b>
        </div>
      ) : null}
      <style jsx>{`
        div.wrapper {
          min-height: 100vh;
          background-color: #f4f4f4;
        }

        div.wrapper div.images-wrapper {
          display: flex;
          flex-flow: row wrap;
          gap: 10px;
          padding: 10px;
        }

        div.wrapper div.images-wrapper div.image-wrapper {
          flex: 0 0 400px;
          display: flex;
          flex-flow: column;
        }

        div.wrapper div.images-wrapper div.image-wrapper div.image {
          background-color: #ffffff;
          position: relative;
          width: 100%;
        }

        div.wrapper div.images-wrapper div.image-wrapper div.actions {
          background-color: #ffffff;
          padding: 10px;
          display: flex;
          flex-flow: row wrap;
          gap: 10px;
        }

        div.loading,
        div.no-images {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-flow: column;
          gap: 10px;
        }
      `}</style>
    </Layout>
  );
}
