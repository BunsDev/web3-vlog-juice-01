import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {  ethers } from 'ethers';
import { CONTRACT_ADDRESS, abi_ } from '@/constant';
import ipfsClient from './api/ipfs_00';
//import { uploadFile } from '@/utils/HandleFileUpload';
import fetchABI from '@/utils/fetchABI';
import  {PostFiles, savePostToIpfs}  from '@/utils/handleFile';
//import fetchABI from '@/utils/fetchABI';


//const client = create(options);
//console.log(client, "****$$$$$EMOJI$$$$$******");

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface PostState {
  title: string;
  content: string;
  coverImage?: string | null;
}

const initialState: PostState = { title: '', content: '' };

function CreatePost({title, content }: PostState) {
  const [post, setPost] = useState<PostState>(initialState);
  const [image, setImage] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
//  const [ loading, setLoading ] = useState<boolean>(false);

  const fileRef = useRef<HTMLInputElement>(null);
 // const { title, content } = post;
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 500);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPost((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
  }

  async function handleNewPost() {
    if (!title || !content) return;
   try {
    const coverImageInput = fileRef.current;
    if (!coverImageInput) {
      alert("Please select a cover image");
      return;
    }
    const coverImage = coverImageInput.files?.[0] ?? null;
    const postData: PostFiles = {
      title: '',
      content: '',
      coverImage,
    };

   // const postData = {title, content, coverImage: fileRef.toString() }
    const hash = await savePostToIpfs(postData);
    //setLoading(true);
    await savePost(title, hash.toString());
    console.log(savePost, "*****Flat earth cult****")
    router.push('/');
   } catch (err) {
    console.error("Error creating new post:", err);
    throw new Error('Failed to create post');
   }
  }

  async function savePost(title: string, hash: string) {
    if (!window.ethereum) {
      console.error("Metamask is not installed or enabled");
      throw new Error('Metamask is not installed or enabled');
    }
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log("No debate just antacipate:", provider);
        const signer = provider.getSigner();
        console.log(signer, "**Power up***");

        const abi = await fetchABI()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        console.log('contract: ', contract);

        const tx = await contract.createPost(title, hash);
        console.log('transact: ', tx);
        //setLoaded(true);
        tx.wait()
        window.alert("publishing post to the BlockChain");
        console.log("Post created successfully")
      } catch (err) {
        console.error('Error creating post: ', err);
        throw new Error("Failed to create post");
      } 
  }

  function triggerOnChange() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    //const added = await uploadFile(uploadedFile, {useLocalNode: false});
    const  added  = await ipfsClient.add(uploadedFile);
    setPost((state) => ({ ...state, coverImage: added.toString()}));
    setImage(uploadedFile);
  }

  return (
    <div className="mx-auto w-[800px]">
      {image && (
        <img
          className="max-w-[800px]"
          src={URL.createObjectURL(image)}
          alt="Cover Image"
        />
      )}
      <input
        onChange={onChange}
        name="title"
        placeholder="Give it a title ..."
        value={post.title}
        className="mt-10 border-none bg-inherit font-semibold text-4xl outline-none placeholder:text-gray-500"
        />
    
      <SimpleMDE
        className="mt-10"
        placeholder="What's on your mind?"
        value={post.content}
        onChange={(value) => setPost({ ...post, content: value })}
      />
      {loaded && (
        <div>
          <button
            className="mr-4 rounded-lg bg-gray-100 px-16 py-4 text-lg shadow-md hover:bg-gray-200"
            type="button"
            onClick={handleNewPost}
          >
            Publish
          </button>
          <button
            onClick={triggerOnChange}
            className="rounded-lg bg-gray-100 px-16 py-4 text-lg shadow-md hover:bg-gray-200"
          >
            Add cover image
          </button>
        </div>
      )}
      <input
        id="selectImage"
        className="hidden"
        type="file"
        onChange={handleFileChange}
        ref={fileRef}
      />
    </div>
  );
}

export default CreatePost;
