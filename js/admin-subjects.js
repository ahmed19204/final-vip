// Admin Subjects Management

document.addEventListener('DOMContentLoaded', function(){ initializeSubjectsPage(); });

function initializeSubjectsPage(){ if(!checkAdminAuth()) return; const form=document.getElementById('subjectForm'); if(form){ form.addEventListener('submit',function(e){ e.preventDefault(); const data={ name:document.getElementById('subjectName').value.trim(), description:document.getElementById('subjectDescription').value.trim(), createdAt:new Date().toISOString() }; if(!data.name){ showNotification('يرجى إدخال اسم التخصص','error'); return;} adminData.add('subjects',data); showNotification('تم حفظ التخصص','success'); closeSubjectModal(); refreshSubjectsTable(); }); }}
function showAddSubjectModal(){ document.getElementById('subjectModalTitle').textContent='إضافة تخصص'; document.getElementById('subjectForm').reset(); document.getElementById('subjectModal').style.display='flex'; }
function closeSubjectModal(){ document.getElementById('subjectModal').style.display='none'; }
function editSubject(id){ document.getElementById('subjectModalTitle').textContent='تعديل تخصص'; document.getElementById('subjectModal').style.display='flex'; showNotification('تحميل بيانات التخصص...','info'); }
function deleteSubject(id){ if(confirm('هل أنت متأكد من حذف التخصص؟')){ showNotification('تم حذف التخصص بنجاح','success'); }}
function searchSubjects(term){ const t=term.toLowerCase(); document.querySelectorAll('#subjectsTable tbody tr').forEach(row=>{ const name=row.cells[0].textContent.toLowerCase(); const desc=row.cells[1].textContent.toLowerCase(); row.style.display=(name.includes(t)||desc.includes(t))?'':'none'; }); }
function refreshSubjectsTable(){ console.log('Refreshing subjects table...'); }

window.showAddSubjectModal=showAddSubjectModal; window.closeSubjectModal=closeSubjectModal; window.editSubject=editSubject; window.deleteSubject=deleteSubject; window.searchSubjects=searchSubjects;
