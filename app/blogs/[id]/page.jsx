"use client";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { assets } from "../../../Assets/assets";
import Footer from "../../../Components/Footer";

const page = ({ params }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlogData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure params.id exists
      if (!params?.id) {
        throw new Error("Blog ID is required");
      }

      const response = await axios.get("/api/blog", {
        params: {
          id: params.id,
        },
      });

      if (response.data && response.data.blog) {
        setData(response.data.blog);
      } else {
        throw new Error("Blog not found");
      }
    } catch (error) {
      console.error("Error fetching blog data:", error);
      setError(error.response?.data?.message || error.message || "Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogData();
  }, [params?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchBlogData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
          <Link href="/" className="block mt-4 text-blue-500 hover:underline">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Main content
  return data ? (
    <>
      <div className="bg-gray-200 py-5 px-5 md:px-12 lg:px-28">
        <div className="flex justify-between items-center">
          <Link href="/">
            <Image
              src={assets.logo}
              width={180}
              alt="Logo"
              className="w-[130px] sm:w-auto"
            />
          </Link>
          <button className="flex items-center gap-2 font-medium py-1 px-3 sm:py-3 sm:px-6 border border-black shadow-[-7px_7px_0px_#000000] hover:shadow-[-5px_5px_0px_#000000] transition-all">
            Get Started <Image src={assets.arrow} alt="Arrow" />
          </button>
        </div>
        <div className="text-center my-24">
          <h1 className="text-2xl sm:text-5xl font-semibold max-w-[700px] mx-auto">
            {data.title}
          </h1>
          {data.authorImg && (
            <Image
              className="mx-auto mt-6 border border-white rounded-full"
              src={data.authorImg}
              alt={data.author || "Author"}
              width={60}
              height={60}
            />
          )}
          <p className="mt-1 pb-2 text-lg max-w-[740px] mx-auto">
            {data.author}
          </p>
          {data.date && (
            <p className="text-sm text-gray-600">
              Published on {new Date(data.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="mx-5 max-w-[800px] md:mx-auto mt-[-100px] mb-10">
        {data.image && (
          <Image
            className="border-4 border-white"
            src={data.image}
            width={1280}
            height={720}
            alt={data.title || "Blog image"}
          />
        )}
        <div
          className="blog-content mt-8 prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: data.description }}
        ></div>
        
        <div className="my-24">
          <p className="text-black font-semibold my-4">
            Share this article on social media
          </p>
          <div className="flex gap-2">
            <Image src={assets.facebook_icon} width={50} alt="Facebook" className="cursor-pointer hover:opacity-80" />
            <Image src={assets.twitter_icon} width={50} alt="Twitter" className="cursor-pointer hover:opacity-80" />
            <Image src={assets.googleplus_icon} width={50} alt="Google Plus" className="cursor-pointer hover:opacity-80" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : null;
};

export default page;
