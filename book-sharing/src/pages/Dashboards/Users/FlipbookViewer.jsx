// import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
// import axios from "../../../axiosConfig";
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
// import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
// import HTMLFlipBook from "react-pageflip";
// import { useParams } from "react-router-dom";
// import "./FlipbookViewer.css"; // We will enhance this file too
// import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// // A functional component for individual pages to optimize rendering
// const Page = React.forwardRef(({ pageNumber, image }, ref) => {
//   return (
//     <div ref={ref} className="page">
//       <img src={image} alt={`Page ${pageNumber}`} className="page-image" />
//     </div>
//   );
// });

// function FlipbookViewer() {
//   const { bookId } = useParams();
//   const [pages, setPages] = useState([]);
//   const [loadingProgress, setLoadingProgress] = useState(0);
//   const [isRtl, setIsRtl] = useState(false);
//   const [totalPages, setTotalPages] = useState(0);
//   const [currentPage, setCurrentPage] = useState(0);

//   // State to hold the calculated dimensions of the flipbook
//   const [bookDimensions, setBookDimensions] = useState({ width: 0, height: 0 });

//   const flipBookRef = useRef();
//   const wrapperRef = useRef(); // Ref for the main container

//   // A simple loading component
//   const CircularProgress = ({ progress }) => (
//     <div className="loading-container">
//       <div className="progress-text">{progress}%</div>
//       <p>Loading your book, please wait...</p>
//     </div>
//   );

//   // Step 1: Detect container size and calculate book dimensions
//   useLayoutEffect(() => {
//     const updateSize = () => {
//       if (!wrapperRef.current || pages.length === 0) return;

//       const wrapperWidth = wrapperRef.current.clientWidth;
//       const wrapperHeight = wrapperRef.current.clientHeight;

//       // Get aspect ratio from the first page (assuming all pages are the same size)
//       const firstPage = document.createElement("img");
//       firstPage.src = pages[0];
//       firstPage.onload = () => {
//         const bookAspectRatio =
//           firstPage.naturalWidth / firstPage.naturalHeight;

//         // The book is displayed as two pages side-by-side, so the container's aspect ratio is for the double page
//         const containerAspectRatio = wrapperWidth / wrapperHeight;
//         const doublePageAspectRatio = bookAspectRatio * 2;

//         let newWidth, newHeight;

//         if (containerAspectRatio > doublePageAspectRatio) {
//           // Container is wider than the book, so height is the limiting factor
//           newHeight = wrapperHeight;
//           newWidth = (newHeight * doublePageAspectRatio) / 2; // Width of a single page
//         } else {
//           // Container is taller than the book, so width is the limiting factor
//           newWidth = wrapperWidth / 2;
//           newHeight = newWidth / bookAspectRatio;
//         }

//         setBookDimensions({
//           width: Math.floor(newWidth),
//           height: Math.floor(newHeight),
//         });
//       };
//     };

//     // Use ResizeObserver for efficient size detection
//     const resizeObserver = new ResizeObserver(updateSize);
//     if (wrapperRef.current) {
//       resizeObserver.observe(wrapperRef.current);
//     }

//     // Initial size calculation
//     updateSize();

//     return () => resizeObserver.disconnect();
//   }, [pages]); // Rerun when pages are loaded

//   // Step 2: Fetch book details and PDF data
//   useEffect(() => {
//     const fetchPDF = async () => {
//       try {
//         const token = localStorage.getItem("token");

//         // Fetch book details to check language
//         const detailsRes = await axios.get(`/api/books/${bookId}/details`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         // Check for RTL language (e.g., Arabic 'ar')

//         // const language =
//         //   detailsRes.data.book?.language || detailsRes.data.book?.language_name;
//         // console.log("Detected Language:", language);
//         // if (language && language.toLowerCase().startsWith("ar")) {
//         //   setIsRtl(true);
//         // }

//         // Fetch PDF data
//         const pdfRes = await axios.get(`/api/books/${bookId}/stream-version`, {
//           headers: { Authorization: `Bearer ${token}` },
//           responseType: "arraybuffer",
//           onDownloadProgress: (progressEvent) => {
//             const percentCompleted = Math.round(
//               (progressEvent.loaded * 100) / progressEvent.total
//             );
//             setLoadingProgress(percentCompleted / 2); // Download is first 50%
//           },
//         });

//         const loadingTask = pdfjsLib.getDocument({ data: pdfRes.data });
//         const pdf = await loadingTask.promise;
//         setTotalPages(pdf.numPages);

//         const imagePages = [];
//         const desiredWidth = 1500; // Render at a high resolution for clarity

//         for (let i = 1; i <= pdf.numPages; i++) {
//           const page = await pdf.getPage(i);
//           const viewport = page.getViewport({ scale: 1.0 });

//           // Calculate dynamic scale based on a desired width for high quality
//           const scale = desiredWidth / viewport.width;
//           const scaledViewport = page.getViewport({ scale });

//           const canvas = document.createElement("canvas");
//           const context = canvas.getContext("2d");
//           canvas.width = scaledViewport.width;
//           canvas.height = scaledViewport.height;

//           await page.render({
//             canvasContext: context,
//             viewport: scaledViewport,
//           }).promise;
//           imagePages.push(canvas.toDataURL("image/jpeg", 0.9)); // Use JPEG for smaller size

//           setLoadingProgress(50 + Math.round((i / pdf.numPages) * 50)); // Rendering is second 50%
//         }

//         // Add a blank page at the end if the total number of pages is odd to make the book feel complete
//         if (imagePages.length % 2 !== 0) {
//           const lastPageCanvas = document.createElement("canvas");
//           const firstPage = await pdf.getPage(1);
//           const viewport = firstPage.getViewport({ scale: 1.5 });
//           lastPageCanvas.width = viewport.width;
//           lastPageCanvas.height = viewport.height;
//           const blankCtx = lastPageCanvas.getContext("2d");
//           blankCtx.fillStyle = "#fdfdfd"; // A slightly off-white color
//           blankCtx.fillRect(0, 0, lastPageCanvas.width, lastPageCanvas.height);
//           imagePages.push(lastPageCanvas.toDataURL());
//         }

//         const language = detailsRes.data.book?.language || detailsRes.data.book?.language_name;
//         const reversedPages = language?.toLowerCase().startsWith("ar")
//           ? [...imagePages].reverse()
//           : imagePages;
//         setIsRtl(language?.toLowerCase().startsWith("ar"));
//         setPages(reversedPages);
//       } catch (error) {
//         console.error("Error loading PDF:", error);
//         // You could set an error state here to show a message to the user
//       }
//     };

//     fetchPDF();
//   }, [bookId]);

//   // Step 3: Handle navigation for LTR and RTL
//   const handleNext = () => {
//     if (!flipBookRef.current) return;
//     if (typeof flipBookRef.current.pageFlip === "function") {
//       if (isRtl) {
//         flipBookRef.current.pageFlip().flipPrev();
//       } else {
//         flipBookRef.current.pageFlip().flipNext();
//       }
//     } else if (typeof flipBookRef.current.flipNext === "function") {
//       if (isRtl) {
//         flipBookRef.current.flipPrev();
//       } else {
//         flipBookRef.current.flipNext();
//       }
//     }
//   };

//   const handlePrev = () => {
//     if (!flipBookRef.current) return;
//     if (typeof flipBookRef.current.pageFlip === "function") {
//       if (isRtl) {
//         flipBookRef.current.pageFlip().flipNext();
//       } else {
//         flipBookRef.current.pageFlip().flipPrev();
//       }
//     } else if (typeof flipBookRef.current.flipPrev === "function") {
//       if (isRtl) {
//         flipBookRef.current.flipNext();
//       } else {
//         flipBookRef.current.flipPrev();
//       }
//     }
//   };

//   // Calculate current page and pages left
//   const currentPageNumber = currentPage + 1;
//   const pagesLeft = Math.max(0, totalPages - currentPageNumber);

//   return (
//     <div className="flipbook-wrapper" ref={wrapperRef}>
//       {pages.length === 0 ? (
//         <div className="loading-overlay">
//           <CircularProgress progress={Math.floor(loadingProgress)} />
//         </div>
//       ) : (
//         <>
//           <HTMLFlipBook
//             width={bookDimensions.width}
//             height={bookDimensions.height}
//             size="stretch"
//             minWidth={150}
//             maxWidth={1000} // Set a reasonable max
//             minHeight={210}
//             maxHeight={1400}
//             maxShadowOpacity={0.5}
//             showCover={true}
//             mobileScrollSupport={true}
//             className="flipbook-container"
//             onFlip={(e) => setCurrentPage(e.data)}
//             ref={flipBookRef}
//             // For RTL, we start on the last page. The library considers pages in pairs.
//             startPage={isRtl ? totalPages - 0 : 0}
//           >
//             {pages.map((page, index) => (
//               <Page key={index} pageNumber={index + 1} image={page} />
//             ))}
//           </HTMLFlipBook>

//           <div className="flipbook-navigation">
//             <button onClick={handlePrev} className="nav-button" aria-label="Previous Page">
//               <FaArrowLeft />
//             </button>
//             <div className="page-info">
//               Page {currentPageNumber} of {totalPages} <br />
//               Pages left: {pagesLeft}
//             </div>
//             <button onClick={handleNext} className="nav-button" aria-label="Next Page">
//               <FaArrowRight />
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default FlipbookViewer;
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "../../../axiosConfig";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import HTMLFlipBook from "react-pageflip";
import { useParams } from "react-router-dom";
import "./FlipbookViewer.css";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function FlipbookViewer() {
  const { bookId } = useParams();
  const [pages, setPages] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const flipBookRef = useRef();
  const totalPagesRef = useRef(0);
  const [bookDimensions, setBookDimensions] = useState({ width: 0, height: 0 });
  const wrapperRef = useRef();
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const language =
          res.data.book?.language || res.data.book?.language_name;
        if (language?.toLowerCase().startsWith("ar")) {
          setIsRtl(true);
        }
      } catch (err) {
        console.error("Failed to fetch language:", err);
      }
    };

    fetchLanguage();
  }, [bookId]);

  useLayoutEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current || pages.length === 0) return;

      const wrapperWidth = wrapperRef.current.clientWidth;
      const wrapperHeight = wrapperRef.current.clientHeight;

      const tempImg = document.createElement("img");
      tempImg.src = pages[0];
      tempImg.onload = () => {
        const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
        const doublePageAspectRatio = aspectRatio * 2;
        const containerAspectRatio = wrapperWidth / wrapperHeight;

        let newWidth, newHeight;

        if (containerAspectRatio > doublePageAspectRatio) {
          newHeight = wrapperHeight;
          newWidth = (newHeight * doublePageAspectRatio) / 2;
        } else {
          newWidth = wrapperWidth / 2;
          newHeight = newWidth / aspectRatio;
        }

        setBookDimensions({
          width: Math.floor(newWidth),
          height: Math.floor(newHeight),
        });
      };
    };

    const observer = new ResizeObserver(updateSize);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    updateSize();

    return () => observer.disconnect();
  }, [pages]);

  const CircularProgress = ({ progress }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="progress-container">
        <svg className="progress-circle" width="100" height="100">
          <circle
            className="progress-circle-bg"
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
          />
          <circle
            className="progress-circle-fill"
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="progress-text">{progress}%</div>
      </div>
    );
  };

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        const token = localStorage.getItem("token");

        await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const pdfRes = await axios.get(`/api/books/${bookId}/stream-version`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        });

        const loadingTask = pdfjsLib.getDocument({ data: pdfRes.data });
        const pdf = await loadingTask.promise;
        totalPagesRef.current = pdf.numPages;

        const imagePages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          imagePages.push(canvas.toDataURL());

          setLoadingProgress(Math.round((i / pdf.numPages) * 100));
        }

        // Ensure even pages count
        if ((imagePages.length - 2) % 2 !== 0) {
          const blankCanvas = document.createElement("canvas");
          blankCanvas.width = 800;
          blankCanvas.height = 1100;
          const blankCtx = blankCanvas.getContext("2d");
          blankCtx.fillStyle = "#ffffff";
          blankCtx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);
          const blankPage = blankCanvas.toDataURL();
          imagePages.splice(imagePages.length - 1, 0, blankPage);
        }

        setPages(imagePages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    fetchPDF();
  }, [bookId]);

  // ✅ Reliable flipping for RTL after pages are ready
  useEffect(() => {
    if (flipBookRef.current && isRtl && pages.length > 0) {
      const maxRetries = 20;
      let tries = 0;

      const interval = setInterval(() => {
        try {
          if (
            flipBookRef.current.pageFlip()?.getCurrentPageIndex !== undefined
          ) {
            flipBookRef.current.pageFlip().flip(pages.length - 1);
            clearInterval(interval);
          }
        } catch (err) {
          if (++tries > maxRetries) clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [pages, isRtl]);

  const orderedPages = isRtl ? [...pages].reverse() : pages;

  return (
    <div className="flipbook-wrapper" ref={wrapperRef}>
      {loadingProgress < 100 ? (
        <div className="loading-overlay">
          <CircularProgress progress={loadingProgress} />
          <p>Loading your flipbook...</p>
        </div>
      ) : (
        <>
          <HTMLFlipBook
            width={bookDimensions.width}
            height={bookDimensions.height}
            size="stretch"
            minWidth={200}
            maxWidth={600}
            minHeight={280}
            maxHeight={840}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            className="flipbook-responsive"
            onFlip={(e) => setCurrentPage(e.data)}
            ref={flipBookRef}
            rtl={isRtl}
          >
            {orderedPages.map((page, index) => (
              <div key={index} className="page">
                <img
                  src={page}
                  alt={`Page ${index + 1}`}
                  className="page-image"
                />
              </div>
            ))}
          </HTMLFlipBook>

          <button
            className="nav-button left"
            onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
          >
            ◀
          </button>

          <button
            className="nav-button right"
            onClick={() => flipBookRef.current?.pageFlip().flipNext()}
          >
            ▶
          </button>

          <div className="page-info">
            Page {isRtl ? pages.length - currentPage : currentPage + 1} of{" "}
            {pages.length} (
            {isRtl ? currentPage : pages.length - (currentPage + 1)} remaining)
          </div>
        </>
      )}
    </div>
  );
}

export default FlipbookViewer;
