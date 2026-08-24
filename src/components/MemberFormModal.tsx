'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, User, CreditCard, Trash2 } from 'lucide-react';
import styles from './MemberFormModal.module.css';
import { Member } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<Member, 'id' | 'created_at'>) => Promise<void>;
  initialData?: Member | null;
  lang: Language;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  lang
}) => {
  const t = translations[lang];

  const [formData, setFormData] = useState({
    member_no: '',
    name: '',
    loan_amount: '',
    savings_initial: '',
    loan_purpose: '',
    admission_date: new Date().toISOString().split('T')[0],
    total_installments: '44',
    mobile: '',
    book_no: '১',
    guarantor_name: '',
    photo_url: '',
    nid_image_url: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        member_no: initialData.member_no || '',
        name: initialData.name || '',
        loan_amount: String(initialData.loan_amount || ''),
        savings_initial: String(initialData.savings_initial || ''),
        loan_purpose: initialData.loan_purpose || '',
        admission_date: initialData.admission_date || new Date().toISOString().split('T')[0],
        total_installments: String(initialData.total_installments || 44),
        mobile: initialData.mobile || '',
        book_no: initialData.book_no || '১',
        guarantor_name: initialData.guarantor_name || '',
        photo_url: initialData.photo_url || '',
        nid_image_url: initialData.nid_image_url || ''
      });
    } else {
      setFormData({
        member_no: '',
        name: '',
        loan_amount: '',
        savings_initial: '0',
        loan_purpose: '',
        admission_date: new Date().toISOString().split('T')[0],
        total_installments: '44',
        mobile: '',
        book_no: '১',
        guarantor_name: '',
        photo_url: '',
        nid_image_url: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Helper to convert image file to Base64 data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldKey: 'photo_url' | 'nid_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, [fieldKey]: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_no || !formData.name) return;

    setSubmitting(true);
    try {
      await onSave({
        member_no: formData.member_no,
        name: formData.name,
        loan_amount: Number(formData.loan_amount || 0),
        savings_initial: Number(formData.savings_initial || 0),
        loan_purpose: formData.loan_purpose,
        admission_date: formData.admission_date,
        total_installments: Number(formData.total_installments || 44),
        mobile: formData.mobile,
        book_no: formData.book_no,
        guarantor_name: formData.guarantor_name,
        photo_url: formData.photo_url,
        nid_image_url: formData.nid_image_url,
        status: 'active'
      });
      onClose();
    } catch (err) {
      console.error('Failed saving member', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {initialData ? t.editMember : t.addMember}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            <div className={styles.grid}>
              {/* Member No */}
              <div className={styles.field}>
                <label className={styles.label}>{t.memberNo} *</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  placeholder="e.g. ১২৫ / 125"
                  value={formData.member_no}
                  onChange={(e) => setFormData({ ...formData, member_no: e.target.value })}
                />
              </div>

              {/* Book No */}
              <div className={styles.field}>
                <label className={styles.label}>{t.bookNo}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ১"
                  value={formData.book_no}
                  onChange={(e) => setFormData({ ...formData, book_no: e.target.value })}
                />
              </div>

              {/* Full Name */}
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>{t.memberName} *</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  placeholder="e.g. আনোয়ার হোসেন"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Jamindar Name (Guarantor Name) */}
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>{t.guarantorName}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. জামিনদারের নাম (মোঃ রফিকুল ইসলাম)"
                  value={formData.guarantor_name}
                  onChange={(e) => setFormData({ ...formData, guarantor_name: e.target.value })}
                />
              </div>

              {/* Person Photo Upload */}
              <div className={styles.field}>
                <label className={styles.label}>{t.personPhoto}</label>
                <div className={styles.uploadSection}>
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Member Photo" className={styles.previewThumb} />
                  ) : (
                    <div className={styles.avatarFallback}>
                      <User size={24} />
                    </div>
                  )}

                  <label className={styles.fileInputLabel}>
                    <Upload size={14} />
                    <span>আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenFileInput}
                      onChange={(e) => handleFileUpload(e, 'photo_url')}
                    />
                  </label>

                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: '' })}
                      className="btn btn-danger btn-sm"
                      title="Remove Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* NID Card Image Upload */}
              <div className={styles.field}>
                <label className={styles.label}>{t.nidImage}</label>
                <div className={styles.uploadSection}>
                  {formData.nid_image_url ? (
                    <img src={formData.nid_image_url} alt="NID Card" className={styles.previewThumb} />
                  ) : (
                    <div className={styles.avatarFallback}>
                      <CreditCard size={24} />
                    </div>
                  )}

                  <label className={styles.fileInputLabel}>
                    <Upload size={14} />
                    <span>NID আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenFileInput}
                      onChange={(e) => handleFileUpload(e, 'nid_image_url')}
                    />
                  </label>

                  {formData.nid_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nid_image_url: '' })}
                      className="btn btn-danger btn-sm"
                      title="Remove NID"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Loan Amount */}
              <div className={styles.field}>
                <label className={styles.label}>{t.loanAmount} (৳) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className={styles.input}
                  placeholder="e.g. 100000"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                />
              </div>

              {/* Initial Savings */}
              <div className={styles.field}>
                <label className={styles.label}>{t.savingsInitial} (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder="e.g. 10000"
                  value={formData.savings_initial}
                  onChange={(e) => setFormData({ ...formData, savings_initial: e.target.value })}
                />
              </div>

              {/* Loan Purpose */}
              <div className={styles.field}>
                <label className={styles.label}>{t.loanPurpose}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ব্যবসা"
                  value={formData.loan_purpose}
                  onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
                />
              </div>

              {/* Installments count */}
              <div className={styles.field}>
                <label className={styles.label}>{t.totalInstallments}</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="44"
                  value={formData.total_installments}
                  onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                />
              </div>

              {/* Admission Date */}
              <div className={styles.field}>
                <label className={styles.label}>{t.admissionDate}</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.admission_date}
                  onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                />
              </div>

              {/* Mobile */}
              <div className={styles.field}>
                <label className={styles.label}>{t.mobile}</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="01712345678"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={submitting}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              <Save size={16} />
              <span>{submitting ? '...' : t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
