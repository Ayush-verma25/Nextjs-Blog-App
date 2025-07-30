"use client";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../../Assets/assets";

const page = () => {
  const [image, setImage] = useState(null); // Changed from false to null
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "Startup",
    author: "Alex Bennett",
    authorImg: "/author_img.png",
  });
  const [loading, setLoading] = useState(false); // Add loading state

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value })); // Fixed state update
    console.log(data);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state

    try {
      // Validate required fields
      if (!data.title.trim() || !data.description.trim() || !image) {
        toast.error("Please fill all required fields and upload an image");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("author", data.author);
      formData.append("authorImg", data.authorImg);
      formData.append("image", image);

      // Add better error handling
      const response = await axios.post("/api/blog", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(response.data.msg || "Blog added successfully!");
        setImage(null); // Reset to null
        setData({
          title: "",
          description: "",
          category: "Startup",
          author: "Alex Bennett",
          authorImg: "/author_img.png",
        });
      } else {
        toast.error(response.data.msg || "Failed to add blog");
      }
    } catch (error) {
      console.error("Error submitting blog:", error);
      // More specific error messages
      if (error.response) {
        toast.error(`Server Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        toast.error("Network error: Unable to reach server");
      } else {
        toast.error("Error: " + error.message);
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <>
      <form onSubmit={onSubmitHandler} className="pt-5 px-5 sm:pt-12 sm:pl-16">
        <p className="text-xl">Upload thumbnail</p>
        <label htmlFor="image" className="cursor-pointer">
          <Image
            className="mt-4 border-2 border-dashed border-gray-300 rounded"
            src={!image ? assets.upload_area : URL.createObjectURL(image)}
            width={140}
            height={70}
            alt="Upload thumbnail"
          />
        </label>
        <input
          onChange={(e) => setImage(e.target.files[0] || null)}
          type="file"
          id="image"
          accept="image/*" // Only accept image files
          hidden
          required
        />

        <p className="text-xl mt-4">Blog title</p>
        <input
          name="title"
          onChange={onChangeHandler}
          value={data.title}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded"
          type="text"
          placeholder="Type here"
          required
        />

        <p className="text-xl mt-4">Blog Description</p>
        <textarea
          name="description"
          onChange={onChangeHandler}
          value={data.description}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded resize-vertical"
          placeholder="Write Content here"
          rows={6}
          required
        />

        <p className="text-xl mt-4">Blog Category</p>
        <select
          onChange={onChangeHandler}
          value={data.category}
          name="category"
          className="w-40 mt-4 px-4 py-3 border text-gray-500 rounded"
        >
          <option value="Startup">Startup</option>
          <option value="Technology">Technology</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>

        <br />
        <button
          type="submit"
          disabled={loading}
          className={`mt-8 w-40 h-12 text-white rounded transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {loading ? "ADDING..." : "ADD"}
        </button>
      </form>
    </>
  );
};

export default page;
