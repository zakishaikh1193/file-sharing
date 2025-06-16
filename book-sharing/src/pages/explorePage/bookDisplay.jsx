import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/bookDisplay.css';
 
const Books = () => {
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [filters, setFilters] = useState({
    subject: [],
    grade: [],
    bookType: [],
    version: [],
    language: [],
    country: [],
    standards: [],
    isbn: [],
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
 
  const navigate = useNavigate();
 
  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };
 
  const toggleFilter = (category, value) => {
    setFilters((prev) => {
      const current = prev[category].map(String);
      const stringValue = String(value);
      const updated = current.includes(stringValue)
        ? current.filter((v) => v !== stringValue)
        : [...current, stringValue];
      return { ...prev, [category]: updated };
    });
  };
 
  const getName = (list, id, key) =>
    list.find((item) => String(item[key]) === String(id))?.[`${key.replace('_id', '')}_name`] || '—';
 
  const getGradeName = (id) =>
    grades.find((g) => String(g.grade_id) === String(id))?.grade_level || '—';
 
  const unique = (key) => {
    return [...new Set(
      books
        .map((b) => {
          switch (key) {
            case 'bookType':
              return b.book_type_title;
            case 'version':
              return b.version_label;
            case 'country':
              return b.country_name;
            case 'isbn':
              return b.isbn_number;
            default:
              return b[key];
          }
        })
        .filter((v) => v)
        .map((v) => v.toString().trim())
    )];
  };
 
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${sizes[i]}`;
  };
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
 
        const [booksRes, gradesRes, subjectsRes, languagesRes, standardsRes] = await Promise.all([
          axios.get('/api/books', { headers }),
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/standards', { headers }),
        ]);
 
        const booksWithExtras = booksRes.data.books.map(book => ({
          ...book,
          version_label: book.version_label || (book.versions?.[0]?.version_label ?? 'N/A'),
          isbn_number: book.isbn_number || (book.versions?.[0]?.isbn_number ?? 'N/A'),
          file_size: book.file_size || book.versions?.[0]?.file_size || null,  // ✅ Add this
        }));
 
        setBooks(booksWithExtras);
        setFilteredBooks(booksWithExtras);
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLanguages(languagesRes.data);
        setStandards(standardsRes.data);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
 
    fetchData();
  }, []);
 
  useEffect(() => {
    const filtered = books.filter((book) => {
      const match = (list, val) => list.length === 0 || list.includes(String(val));
      return (
        match(filters.grade, book.grade_id) &&
        match(filters.subject, book.subject_id) &&
        match(filters.bookType, book.book_type_title) &&
        match(filters.version, book.version_label) &&
        match(filters.country, book.country_name) &&
        match(filters.language, book.language_id) &&
        match(filters.standards, book.standard_id) &&
        match(filters.isbn, book.isbn_number)
      );
    });
    setFilteredBooks(filtered);
  }, [filters, books]);
 
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('bookx-details-overlay')) {
      setSelectedBook(null);
    }
  };
 
  return (
    <div className="bookx-container">
      <div className="bookx-sidebar">
        <h3 className="bookx-sidebar-title">Filters</h3>
        {['subject', 'grade', 'bookType', 'version', 'isbn', 'language', 'country', 'standards'].map((cat) => (
          <div key={cat} className="bookx-filter-group">
            <div className="bookx-filter-header" onClick={() => toggleDropdown(cat)}>
              <strong>{cat.charAt(0).toUpperCase() + cat.slice(1)}</strong>
              <span>{activeDropdown === cat ? '▲' : '▼'}</span>
            </div>
            {activeDropdown === cat && (
              <ul className="bookx-options-list">
                {(cat === 'subject'
                  ? subjects
                  : cat === 'grade'
                  ? grades
                  : cat === 'language'
                  ? languages
                  : cat === 'standards'
                  ? standards
                  : unique(cat)
                ).map((option) => {
                  let value, label;
                  if (typeof option === 'object') {
                    if (cat === 'grade') {
                      value = String(option.grade_id);
                      label = option.grade_level;
                    } else if (cat === 'subject') {
                      value = String(option.subject_id);
                      label = option.subject_name;
                    } else if (cat === 'language') {
                      value = String(option.language_id);
                      label = option.language_name;
                    } else if (cat === 'standards') {
                      value = String(option.standard_id);
                      label = option.standard_name;
                    }
                  } else {
                    value = String(option);
                    label = option;
                  }
                  return (
                    <li key={value}>
                      <label>
                        <input
                          type="checkbox"
                          onChange={() => toggleFilter(cat, value)}
                          checked={filters[cat].includes(value)}
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
 
      <div className="bookx-content">
        <h2 className="bookx-content-heading">Books Available</h2>
        <div className="bookx-grid">
          {filteredBooks.length === 0 ? (
            <p className="bookx-no-books">No books match selected filters.</p>
          ) : (
            filteredBooks.map((book) => (
              <div key={book.book_id} className="bookx-card">
                <img
                  src={
                    book.img ||
                    book.coverUrl ||
                    'https://mckups.com/wp-content/uploads/2021/04/isometric-view-torn-book-cover-mockup-Graphics-9752611-1-1-scaled.jpeg'
                  }
                  alt={book.title}
                  className="bookx-card-image"
                />
                <div className="bookx-card-body">
                  <h4 className="bookx-card-title">{book.title}</h4>
                  <p className="bookx-card-description">{book.description}</p>
                  <div className="bookx-card-meta">
                    <div>
                      <strong>Subject:</strong> {getName(subjects, book.subject_id, 'subject_id')}
                    </div>
                    <div>
                      <strong>Grade:</strong> {getGradeName(book.grade_id)}
                    </div>
                    <div>
                      <strong>Type:</strong> {book.book_type_title || 'N/A'}
                    </div>
                    <div>
                      <strong>Version:</strong> {book.version_label || 'N/A'}
                    </div>
                    <div>
                      <strong>Language:</strong> {getName(languages, book.language_id, 'language_id')}
                    </div>
                    <div>
                      <strong>Country:</strong> {book.country_name || 'N/A'}
                    </div>
                    <div>
                      <strong>ISBN:</strong> {book.isbn_number || 'N/A'}
                    </div>
                  </div>
                  <button className="bookx-card-button" onClick={() => setSelectedBook(book)}>
                    Read More
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
 
      {selectedBook && (
        <div
          className="bookx-details-overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
        >
          <div className="bookx-details-container">
            <button
              className="bookx-close-button"
              onClick={() => setSelectedBook(null)}
              aria-label="Close details"
            >
              ×
            </button>
 
            <div className="bookx-details-content">
              <h2 className="bookx-card-title">{selectedBook.title}</h2>
              <table className="bookx-details-table">
                <tbody>
                  <tr>
                    <th>Description</th>
                    <td>{selectedBook.description}</td>
                  </tr>
                  <tr>
                    <th>Subject</th>
                    <td>{getName(subjects, selectedBook.subject_id, 'subject_id')}</td>
                  </tr>
                  <tr>
                    <th>Grade</th>
                    <td>{getGradeName(selectedBook.grade_id)}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>{selectedBook.book_type_title || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Version</th>
                    <td>{selectedBook.version_label || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Language</th>
                    <td>{getName(languages, selectedBook.language_id, 'language_id')}</td>
                  </tr>
                  <tr>
                    <th>Country</th>
                    <td>{selectedBook.country_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>ISBN</th>
                    <td>{selectedBook.isbn_number || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
 
              <div className="bookx-details-buttons">
                <button className="bookx-card-button" onClick={() => setSelectedBook(null)}>
                  Back
                </button>
 
                <button
                  className="bookx-card-button"
                  onClick={() => {
                    setSelectedBook(null);
                    setTimeout(() => navigate(`/books/${selectedBook.book_id}/flipbook`), 0);
                  }}
                >
                  View Book
                </button>
 
                <button className="bookx-card-button">View Cover</button>
              </div>
            </div>
 
            <div className="bookx-details-image-wrapper">
              <img
                className="bookx-details-image"
                src={
                  selectedBook.img ||
                  selectedBook.coverUrl ||
                  'https://mckups.com/wp-content/uploads/2021/04/isometric-view-torn-book-cover-mockup-Graphics-9752611-1-1-scaled.jpeg'
                }
                alt={selectedBook.title}
              />
              <p className="bookx-file-size">
                File Size: {formatFileSize(selectedBook.file_size)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Books;