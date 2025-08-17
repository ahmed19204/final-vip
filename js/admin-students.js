// Admin Students Management

document.addEventListener('DOMContentLoaded', function(){ initializeStudentsPage(); });

function initializeStudentsPage(){ if(!checkAdminAuth()) return; const form=document.getElementById('studentForm'); if(form){ form.addEventListener('submit',function(e){ e.preventDefault(); const data={ name:document.getElementById('studentName').value.trim(), email:document.getElementById('studentEmail').value.trim(), phone:document.getElementById('studentPhone').value.trim(), status:document.getElementById('studentStatus').value, createdAt:new Date().toISOString() }; if(!validateEmail(data.email)){ showNotification('يرجى إدخال بريد صالح', 'error'); return;} adminData.add('students',data); showNotification('تم حفظ بيانات الطالب','success'); closeStudentModal(); refreshStudentsTable(); }); }}

function showAddStudentModal(){ document.getElementById('studentModalTitle').textContent='إضافة طالب'; document.getElementById('studentForm').reset(); document.getElementById('studentModal').style.display='flex'; }
function closeStudentModal(){ document.getElementById('studentModal').style.display='none'; }
function editStudent(id){ document.getElementById('studentModalTitle').textContent='تعديل طالب'; document.getElementById('studentModal').style.display='flex'; showNotification('تحميل بيانات الطالب...','info'); }
function deleteStudent(id){ if(confirm('هل أنت متأكد من حذف الطالب؟')){ showNotification('تم حذف الطالب بنجاح','success'); }}
function searchStudents(term){ const t=term.toLowerCase(); document.querySelectorAll('#studentsTable tbody tr').forEach(row=>{ const name=row.cells[0].textContent.toLowerCase(); const email=row.cells[1].textContent.toLowerCase(); row.style.display=(name.includes(t)||email.includes(t))?'':'none'; }); }
function refreshStudentsTable(){ console.log('Refreshing students table...'); }

window.showAddStudentModal=showAddStudentModal; window.closeStudentModal=closeStudentModal; window.editStudent=editStudent; window.deleteStudent=deleteStudent; window.searchStudents=searchStudents;
