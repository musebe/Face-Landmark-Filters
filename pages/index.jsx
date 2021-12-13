import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  CLOUDINARY_FOLDER_NAME,
  FILTERS,
  FILTERS_FOLDER_NAME,
} from "../lib/constants";

export default function Home() {
  const router = useRouter();

  const [filters, setFilters] = useState(null);

  /**
   * @type {[File, (file:File)=>void]}
   */
  const [image, setImage] = useState(null);

  /**
   * @type {[boolean, (uploading:boolean)=>void]}
   */
  const [loading, setLoading] = useState(false);

  /**
   * @type {[boolean, (uploading:boolean)=>void]}
   */
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const getFilters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/filters", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      setFilters(
        FILTERS.map((filter) => {
          const resource = data.result.find((result) => {
            return (
              result.public_id ===
              `${CLOUDINARY_FOLDER_NAME}${FILTERS_FOLDER_NAME}${filter.publicId}`
            );
          });

          return {
            ...filter,
            resource,
          };
        }).filter((filter) => filter.resource)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getFilters();
  }, [getFilters]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      setUploadInProgress(true);

      const formData = new FormData(event.target);

      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      router.push("/images");
    } catch (error) {
      console.error(error);
    } finally {
      setUploadInProgress(false);
    }
  };

  return (
    <Layout>
      <div className="wrapper">
        <form onSubmit={handleFormSubmit}>
          {loading ? (
            <small>getting filters...</small>
          ) : (
            <small>Ready. {filters?.length} filters available</small>
          )}

          {filters && (
            <div className="filters">
              {filters.map((filter) => (
                <div key={filter.resource.public_id} className="filter">
                  <label htmlFor={filter.publicId}>
                    <Image
                      src={filter.resource.secure_url}
                      alt={filter.resource.secure_url}
                      layout="fill"
                    ></Image>
                  </label>
                  <input
                    type="radio"
                    name={filter.landmark}
                    id={filter.publicId}
                    value={filter.publicId}
                    disabled={uploadInProgress}
                  ></input>
                </div>
              ))}
            </div>
          )}

          {image && (
            <div className="preview">
              <Image
                src={URL.createObjectURL(image)}
                alt="Image preview"
                layout="fill"
              ></Image>
            </div>
          )}
          <div className="form-group file">
            <label htmlFor="photo">Click to select photo</label>
            <input
              type="file"
              id="photo"
              name="photo"
              multiple={false}
              hidden
              accept=".png,.jpg,.jpeg"
              disabled={uploadInProgress}
              onInput={(event) => {
                setImage(event.target.files[0]);
              }}
            />
          </div>

          <button
            className="button"
            type="submit"
            disabled={!image || uploadInProgress || !filters}
          >
            Upload
          </button>
        </form>
      </div>
      <style jsx>{`
        div.wrapper {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        div.wrapper form {
          width: 60%;
          max-width: 600px;
          min-width: 300px;
          padding: 20px;
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          justify-content: start;
          align-items: center;
          gap: 20px;
          background-color: #ffffff;
        }

        div.wrapper form div.preview {
          position: relative;
          height: 200px;
          width: 100%;
          object-fit: cover;
        }

        div.wrapper form div.filters {
          width: 100%;
          height: 200px;
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        div.wrapper form div.filters div.filter {
          flex: 0 0 50px;
          display: flex;
          flex-flow: row-reverse nowrap;
          padding: 10px;
          border: 1px solid #cccccc;
          border-radius: 5px;
        }

        div.wrapper form div.filters div.filter label {
          position: relative;
          width: 100px;
          height: 100px;
        }

        div.wrapper form div.form-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flec-start;
        }

        div.wrapper form div.form-group.file {
          background-color: #f1f1f1;
          height: 150px;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        div.wrapper form div.form-group label {
          font-weight: bold;
          height: 100%;
          width: 100%;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        div.wrapper form div.form-group.file input {
          height: 100%;
          width: 100%;
          cursor: pointer;
        }

        div.wrapper form button {
          width: 100%;
        }
      `}</style>
    </Layout>
  );
}
