"use client";

import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../../Assets/assets";

const Page = () => {
  const [image, setImage] = useState(null); // Changed from false to null
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "Startup",
    author: "Alex Bennett",
    authorImg: "/author_img.png",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please upload a thumbnail image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("author", data.author);
      formData.append("authorImg", data.authorImg);
      formData.append("image", image);

      const response = await axios.post("/api/blog", formData);

      if (response.data.success) {
        toast.success(response.data.msg || "Blog posted successfully!");
        setImage(null);
        setData({
          title: "",
          description: "",
          category: "Startup",
          author: "Alex Bennett",
          authorImg: "/author_img.png",
        });
      } else {
        toast.error(response.data.msg || "Something went wrong");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit blog. Try again.");
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="pt-5 px-5 sm:pt-12 sm:pl-16">
      <p className="text-xl">Upload thumbnail</p>
      <label htmlFor="image">
        <Image
          className="mt-4 cursor-pointer"
          src={
            image ? URL.createObjectURL(image) : assets.upload_area
          }
          width={140}
          height={70}
          alt="Upload Thumbnail"
        />
      </label>
      <input
        type="file"
        id="image"
        accept="image/*"
        hidden
        onChange={(e) => setImage(e.target.files[0])}
        required
      />

      <p className="text-xl mt-4">Blog title</p>
      <input
        name="title"
        onChange={onChangeHandler}
        value={data.title}
        className="w-full sm:w-[500px] mt-4 px-4 py-3 border"
        type="text"
        placeholder="Type here"
        required
      />

      <p className="text-xl mt-4">Blog Description</p>
      <textarea
        name="description"
        onChange={onChangeHandler}
        value={data.description}
        className="w-full sm:w-[500px] mt-4 px-4 py-3 border"
        placeholder="Write Content here"
        rows={6}
        required
      />

      <p className="text-xl mt-4">Blog Category</p>
      <select
        onChange={onChangeHandler}
        value={data.category}
        name="category"
        className="w-40 mt-4 px-4 py-3 border text-gray-500"
      >
        <option value="Startup">Startup</option>
        <option value="Technology">Technology</option>
        <option value="Lifestyle">Lifestyle</option>
      </select>

      <br />
      <button type="submit" className="mt-8 w-40 h-12 bg-black text-white hover:bg-gray-800 transition">
        ADD
      </button>
    </form>
  );
};

export default Page;
