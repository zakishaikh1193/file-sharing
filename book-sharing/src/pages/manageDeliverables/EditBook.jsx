import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/manageDeliverables/AddBook.css';
 
export default function EditBookForm() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade_id: '',
    subject_id: '',
    language_id: '',
    standard_id: '',
    country_id: '',
    booktype_id: '',
    version_label: '',
    isbn_code: '',
    version_file: null,
    cover_file: null,
    resource_file: null,
    zip_file: null,
  });
 
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [countries, setCountries] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({
    version: 0,
    zip: 0,
    cover: 0,
    resource: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
 
        // Fetch all the necessary data
        const [bookRes, gradesRes, subjectsRes, languagesRes, bookTypesRes, standardsRes, countriesRes] =
          await Promise.all([
            axios.get(`/api/books/${bookId}/details`, { headers }),
            axios.get('/api/grades', { headers }),
            axios.get('/api/subjects', { headers }),
            axios.get('/api/languages', { headers }),
            axios.get('/api/booktypes', { headers }),
            axios.get('/api/standards', { headers }),
            axios.get('/api/countries', { headers }),
          ]);
 
        // Set the form data with the book details
        const bookData = bookRes.data.book;
        console.log('Book data received:', bookData); // Debug log
 
        if (!bookData) {
          throw new Error('Book data not found');
        }
 
        setFormData({
          title: bookData.title || '',
          description: bookData.description || '',
          grade_id: bookData.grade_id || '',
          subject_id: bookData.subject_id || '',
          language_id: bookData.language_id || '',
          standard_id: bookData.standard_id || '',
          country_id: bookData.country_id || '',
          booktype_id: bookData.booktype_id || '',
          version_label: bookData.version_label || '',
          isbn_code: bookData.isbn_code || '',
          version_file: null,
          cover_file: null,
          resource_file: null,
          zip_file: null,
        });
 
        // Set all the dropdown options
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLanguages(languagesRes.data);
        setBookTypes(bookTypesRes.data);
        setStandards(standardsRes.data);
        setCountries(countriesRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'Failed to fetch book details');
        setLoading(false);
      }
    };
 
    fetchData();
  }, [bookId]);
 
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
 
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress({ version: 0, cover: 0, resource: 0 });
    setUploadComplete(false);
    setError(null);
 
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
 
      console.log('Attempting to update book with ID:', bookId);
      console.log('Update payload:', {
        title: formData.title,
        description: formData.description,
        grade_id: formData.grade_id,
        subject_id: formData.subject_id,
        language_id: formData.language_id,
        standard_id: formData.standard_id,
        country_id: formData.country_id,
        booktype_id: formData.booktype_id,
        isbn_code: formData.isbn_code,
        version_label: formData.version_label
      });
 
      // 1. Update book details
      try {
        const response = await axios.put(`/api/books/update/${bookId}`, {
          title: formData.title,
          description: formData.description,
          grade_id: formData.grade_id,
          subject_id: formData.subject_id,
          language_id: formData.language_id,
          standard_id: formData.standard_id,
          country_id: formData.country_id,
          booktype_id: formData.booktype_id,
          isbn_code: formData.isbn_code,
          version_label: formData.version_label
        }, config);
        console.log('Update response:', response.data);
      } catch (updateError) {
        console.error('Error updating book details:', updateError);
        console.error('Error response:', updateError.response);
        throw updateError;
      }
 
      // 2. Update version if new file is provided
      if (formData.version_file) {
        console.log('Updating version file...');
        const versionForm = new FormData();
        versionForm.append('book_id', bookId);
        versionForm.append('version_label', formData.version_label);
        versionForm.append('isbn_code', formData.isbn_code);
        versionForm.append('version_file', formData.version_file);
        if (formData.zip_file) {
          versionForm.append('zip_file', formData.zip_file);
        }
 
        try {
          const versionResponse = await axios.put(`/api/books/book-versions/${bookId}`, versionForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, version: percent }));
            }
          });
          console.log('Version update response:', versionResponse.data);
        } catch (versionError) {
          console.error('Error updating version:', versionError);
          console.error('Version error response:', versionError.response);
          throw versionError;
        }
      }
 
      // 3. Update cover if new file is provided
      if (formData.cover_file) {
        console.log('Updating cover file...');
        const coverForm = new FormData();
        coverForm.append('book_id', bookId);
        coverForm.append('file', formData.cover_file);
        try {
          const coverResponse = await axios.put(`/api/books/covers/${bookId}`, coverForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, cover: percent }));
            }
          });
          console.log('Cover update response:', coverResponse.data);
        } catch (coverError) {
          console.error('Error updating cover:', coverError);
          console.error('Cover error response:', coverError.response);
          throw coverError;
        }
      }
 
      // 4. Update resource if new file is provided
      if (formData.resource_file) {
        console.log('Updating resource file...');
        const resForm = new FormData();
        resForm.append('book_id', bookId);
        resForm.append('file', formData.resource_file);
 
        try {
          const resourceResponse = await axios.post('/api/books/uploads', resForm, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...config.headers,
            },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, resource: percent }));
            },
          });
          console.log('Resource update response:', resourceResponse.data);
        } catch (resourceError) {
          console.error('Error updating resource:', resourceError);
          console.error('Resource error response:', resourceError.response);
          throw resourceError;
        }
      }
 
      setUploadComplete(true);
      setTimeout(() => {
        navigate('/admin/books');
      }, 1000);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      console.error('Full error details:', {
        message: err.message,
        response: err.response,
        request: err.request,
        config: err.config
      });
      setError(err.response?.data?.error || 'Error updating book');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  if (loading) return <div className="books-table-loading">Loading book details...</div>;
  if (error) return <div className="error-message">{error}</div>;
 
  return (
    <form onSubmit={handleSubmit} className="enhanced-book-form">
      <button
        type="button"
        className="form-back-btn"
        onClick={() => navigate('/admin/books')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>
      <h2>Edit Book</h2>
      <div className="form-grid">
        <label>
          Book Title:
          <input
            type="text"
            name="title"
            value={formData.title}
            placeholder="Enter Book Title"
            onChange={handleChange}
            required
          />
        </label>
 
        <label className="full-width">
          Description:
          <textarea
            name="description"
            value={formData.description}
            placeholder="Enter Description"
            onChange={handleChange}
          />
        </label>
 
        <label>
          Grade:
          <select
            name="grade_id"
            value={formData.grade_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Grade --</option>
            {grades.map(g => (
              <option key={g.grade_id} value={g.grade_id}>
                {g.grade_level}
              </option>
            ))}
          </select>
        </label>
 
        <label>
          Subject:
          <select
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Subject --</option>
            {subjects.map(s => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>
        </label>
 
        <label>
          Language:
          <select
            name="language_id"
            value={formData.language_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Language --</option>
            {languages.map(l => (
              <option key={l.language_id} value={l.language_id}>
                {l.language_name}
              </option>
            ))}
          </select>
        </label>
 
        <label>
          Standard:
          <select
            name="standard_id"
            value={formData.standard_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Standard --</option>
            {standards.map(st => (
              <option key={st.standard_id} value={st.standard_id}>
                {st.standard_name}
              </option>
            ))}
          </select>
        </label>
 
        <label>
          Country:
          <select
            name="country_id"
            value={formData.country_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Country --</option>
            {countries.map(c => (
              <option key={c.country_id} value={c.country_id}>
                {c.country_name}
              </option>
            ))}
          </select>
        </label>
 
        <label>
          Book Type:
          <select
            name="booktype_id"
            value={formData.booktype_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Book Type --</option>
            {bookTypes.map(bt => (
              <option key={bt.book_type_id} value={bt.book_type_id}>
                {bt.book_type_title}
              </option>
            ))}
          </select>
        </label>
 
        <label>
          Version Label:
          <input
            type="text"
            name="version_label"
            value={formData.version_label}
            placeholder="e.g. v1.0, Revised Edition"
            onChange={handleChange}
            required
          />
        </label>
 
        <label>
          ISBN Code:
          <input
            type="text"
            name="isbn_code"
            value={formData.isbn_code}
            placeholder="Enter ISBN Code"
            onChange={handleChange}
          />
        </label>
 
        <label>
          Upload New Version File (PDF):
          <input
            type="file"
            name="version_file"
            accept="application/pdf"
            onChange={handleChange}
          />
        </label>
 
        <label>
          Upload New ZIP File (optional):
          <input
            type="file"
            name="zip_file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={handleChange}
          />
        </label>
 
        <label>
          Upload New Cover Image:
          <input
            type="file"
            name="cover_file"
            accept="image/*"
            onChange={handleChange}
          />
        </label>
 
        <label>
          Upload New Resource File (optional):
          <input
            type="file"
            name="resource_file"
            onChange={handleChange}
          />
        </label>
      </div>
 
      <button
        type="submit"
        className="submit-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Updating...' : 'Update Book'}
      </button>
 
      {uploadComplete && (
        <div className="success-message">
          Book updated successfully! Redirecting...
        </div>
      )}
 
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </form>
  );
}