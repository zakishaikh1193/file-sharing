import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import { MdEdit, MdDelete } from "react-icons/md";

import AddCountryModal from "./AddCountryModal";
import AddGradeModal from "./AddGradeModal";
import AddSubjectModal from "./AddSubjectModal";
import AddBookTypeModal from "./AddBookTypeModal";
import AddLanguageModal from "./AddLanguageModal";
import AddStandardModal from "./AddStandardModal";

import "../../styles/manageData_Css/ManageDataAdmin.css";

const ManageDataAdmin = () => {
  const [countries, setCountries] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [showModal, setShowModal] = useState({});
  const [collapsed, setCollapsed] = useState({});

  const [editValue, setEditValue] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState("");

  const tokenHeader = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      axios.get("/api/countries", tokenHeader).then((res) => setCountries(res.data)),
      axios.get("/api/grades", tokenHeader).then((res) => setGrades(res.data)),
      axios.get("/api/subjects", tokenHeader).then((res) => setSubjects(res.data)),
      axios.get("/api/booktypes", tokenHeader).then((res) => setBookTypes(res.data)),
      axios.get("/api/languages", tokenHeader).then((res) => setLanguages(res.data)),
      axios.get("/api/standards", tokenHeader).then((res) => setStandards(res.data)),
    ]);
  };

  const toggleCollapse = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEditOpen = (item, type) => {
    setEditItem(item);
    setEditType(type);
    setEditValue(
      type === "country"
        ? item.country_name
        : item.grade_level
    );
    setShowModal((prev) => ({ ...prev, edit: true }));
  };

  const handleEditSave = async () => {
    try {
      const endpoint =
        editType === "country"
          ? `/api/countries/${editItem.country_id}`
          : `/api/grades/${editItem.grade_id}`;

      const payload =
        editType === "country"
          ? { country_name: editValue }
          : { grade_level: editValue };

      await axios.put(endpoint, payload, tokenHeader);
      setShowModal({});
      setEditItem(null);
      setEditValue("");
      fetchAll();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const renderActions = (item) => (
    <td className="actions-cell">
      <MdEdit className="action-icon" onClick={() => console.log("Edit:", item)} />
      <MdDelete className="action-icon" onClick={() => console.log("Delete:", item)} />
    </td>
  );

  return (
    <div className="manage-data-admin-container">
      <h1 className="manage-title">Manage Data</h1>

      {/* 🌍 Countries and 📘 Grades */}
      <div className="horizontal-button-group">
        <div className="button-group-section">
          <h2>Countries</h2>
          <button className="add-data-button" onClick={() => setShowModal({ country: true })}>
            + Add Country
          </button>
          <div className="button-list">
            {countries.map((c) => (
              <button
                key={c.country_id}
                className="item-button"
                onClick={() => handleEditOpen(c, "country")}
              >
                {c.country_name}
              </button>
            ))}
          </div>
        </div>

        <div className="button-group-section">
          <h2>Grades</h2>
          <button className="add-data-button" onClick={() => setShowModal({ grade: true })}>
            + Add Grade
          </button>
          <div className="button-list">
            {grades.map((g) => (
              <button
                key={g.grade_id}
                className="item-button"
                onClick={() => handleEditOpen(g, "grade")}
              >
                {g.grade_level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📄 Subjects & Book Types in Horizontal Table Layout */}
      <div className="horizontal-sections-row">
        <section className="data-section half-width">
          <div className="section-header" onClick={() => toggleCollapse("subject")}>
            <h2>Subjects</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal({ subject: true });
              }}
            >
              + Add
            </button>
          </div>
          {!collapsed["subject"] && (
            <table>
              <thead>
                <tr>
                  <th>SUBJECT ID</th>
                  <th>SUBJECT NAME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item) => (
                  <tr key={item.subject_id}>
                    <td>{item.subject_id}</td>
                    <td>{item.subject_name}</td>
                    {renderActions(item)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showModal.subject && (
            <AddSubjectModal onClose={() => setShowModal({})} onSuccess={fetchAll} />
          )}
        </section>

        <section className="data-section half-width">
          <div className="section-header" onClick={() => toggleCollapse("booktype")}>
            <h2>Book Types</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal({ booktype: true });
              }}
            >
              + Add
            </button>
          </div>
          {!collapsed["booktype"] && (
            <table>
              <thead>
                <tr>
                  <th>BOOK TYPE ID</th>
                  <th>BOOK TYPE TITLE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bookTypes.map((item) => (
                  <tr key={item.book_type_id}>
                    <td>{item.book_type_id}</td>
                    <td>{item.book_type_title}</td>
                    {renderActions(item)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showModal.booktype && (
            <AddBookTypeModal onClose={() => setShowModal({})} onSuccess={fetchAll} />
          )}
        </section>
      </div>

      {/* ✏️ Edit Modal for Country/Grade */}
      {showModal.edit && (
        <div className="edit-modal-overlay">
          <div className="edit-modal-content">
            <h3>Edit {editType === "country" ? "Country" : "Grade"}</h3>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-input"
            />
            <div className="edit-button-group">
              <button onClick={handleEditSave}>Update</button>
              <button className="cancel-btn" onClick={() => setShowModal({})}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 Languages & Standards Section */}
      <div className="horizontal-sections">
        {[
          {
            title: "Standards",
            key: "standard",
            data: standards,
            columns: ["standard_id", "standard_name"],
            modal: (
              <AddStandardModal onClose={() => setShowModal({})} onSuccess={fetchAll} />
            ),
          },
          {
            title: "Languages",
            key: "language",
            data: languages,
            columns: ["language_id", "language_name"],
            extra: (item) =>
              countries.find((c) => c.country_id === item.country_id)?.country_name || "Unknown",
            modal: (
              <AddLanguageModal onClose={() => setShowModal({})} onSuccess={fetchAll} />
            ),
          },
        ].map(({ title, key, data, columns, modal, extra }) => (
          <section className="data-section" key={key}>
            <div className="section-header" onClick={() => toggleCollapse(key)}>
              <h2>{title}</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal({ [key]: true });
                }}
              >
                + Add
              </button>
            </div>
            {!collapsed[key] && (
              <table>
                <thead>
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i}>{col.replace("_", " ").toUpperCase()}</th>
                    ))}
                    {extra && <th>Country</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item[columns[0]]}>
                      {columns.map((col, i) => (
                        <td key={i}>{item[col]}</td>
                      ))}
                      {extra && <td>{extra(item)}</td>}
                      {renderActions(item)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {showModal[key] && modal}
          </section>
        ))}
      </div>
    </div>
  );
};

export default ManageDataAdmin;
