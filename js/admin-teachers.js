// Admin Teachers Management

let teacherBioQuill = null;
let imageCropper = null;
let tempImageDataUrl = null;

document.addEventListener('DOMContentLoaded', function() {
	initializeTeachersPage();
});

function initializeTeachersPage() {
	if (!checkAdminAuth()) return;

	// Initialize Quill editor for bio
	const bioEditorEl = document.getElementById('teacherBioEditor');
	if (bioEditorEl) {
		teacherBioQuill = new Quill('#teacherBioEditor', {
			theme: 'snow',
			placeholder: 'اكتب السيرة الذاتية للمدرس...'
		});
	}

	// Image upload with cropper
	const imageInput = document.getElementById('teacherImage');
	if (imageInput) {
		imageInput.addEventListener('change', handleTeacherImageSelect);
	}

	// Form submit
	const form = document.getElementById('teacherForm');
	if (form) {
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			const teacherData = collectTeacherFormData();

			if (!teacherData.name) {
				showNotification('يرجى إدخال اسم المدرس', 'error');
				return;
			}

			// TODO: إضافة المدرس إلى قاعدة البيانات
			console.log('بيانات المدرس:', teacherData);
			showNotification('تم حفظ بيانات المدرس بنجاح!', 'success');
			closeTeacherModal();
			refreshTeachersTable();
		});
	}
}

function collectTeacherFormData() {
	const subjectsSelect = document.getElementById('teacherSubjects');
	const selectedSubjects = Array.from(subjectsSelect.selectedOptions).map(o => o.value);
	return {
		name: document.getElementById('teacherName').value.trim(),
		subjects: selectedSubjects,
		phone: document.getElementById('teacherPhone').value.trim(),
		email: document.getElementById('teacherEmail').value.trim(),
		bioHtml: teacherBioQuill ? teacherBioQuill.root.innerHTML : '',
		avatar: tempImageDataUrl || null,
		createdAt: new Date().toISOString()
	};
}

function handleTeacherImageSelect(e) {
	const file = e.target.files[0];
	if (!file) return;
	const allowed = ['image/jpeg','image/png','image/jpg'];
	if (!allowed.includes(file.type)) {
		showNotification('نوع الصورة غير مدعوم', 'error');
		return;
	}
	if (file.size > 5 * 1024 * 1024) {
		showNotification('حجم الصورة يجب ألا يتجاوز 5MB', 'error');
		return;
	}
	const reader = new FileReader();
	reader.onload = function(evt) {
		openImageCropper(evt.target.result);
	};
	reader.readAsDataURL(file);
}

function openImageCropper(dataUrl) {
	tempImageDataUrl = dataUrl;
	const modal = document.getElementById('imageCropperModal');
	const img = document.getElementById('cropperImage');
	img.src = dataUrl;
	modal.style.display = 'flex';
	if (imageCropper) {
		imageCropper.destroy();
	}
	imageCropper = new Cropper(img, {
		aspectRatio: 1,
		viewMode: 1,
		background: false,
		autoCropArea: 1
	});
}

function closeImageCropper() {
	const modal = document.getElementById('imageCropperModal');
	modal.style.display = 'none';
	if (imageCropper) {
		imageCropper.destroy();
		imageCropper = null;
	}
}

function applyImageCrop() {
	if (!imageCropper) return;
	const canvas = imageCropper.getCroppedCanvas({ width: 300, height: 300 });
	tempImageDataUrl = canvas.toDataURL('image/png');
	document.getElementById('teacherImagePreview').style.display = 'block';
	document.getElementById('teacherImagePreview').innerHTML = `<img src="${tempImageDataUrl}" alt="Avatar" style="border-radius:50%;max-width:150px;">`;
	closeImageCropper();
}

function showAddTeacherModal() {
	document.getElementById('teacherModalTitle').textContent = 'إضافة مدرس جديد';
	document.getElementById('teacherForm').reset();
	if (teacherBioQuill) teacherBioQuill.root.innerHTML = '';
	document.getElementById('teacherModal').style.display = 'flex';
}

function editTeacher(id) {
	document.getElementById('teacherModalTitle').textContent = 'تعديل بيانات المدرس';
	document.getElementById('teacherModal').style.display = 'flex';
	showNotification('تحميل بيانات المدرس للتعديل (تجريبي)', 'info');
}

function deleteTeacher(id) {
	if (confirm('هل أنت متأكد من حذف المدرس؟')) {
		showNotification('تم حذف المدرس (تجريبي)', 'success');
	}
}

function closeTeacherModal() {
	document.getElementById('teacherModal').style.display = 'none';
}

function refreshTeachersTable() {
	console.log('Refreshing teachers table...');
}

function searchTeachers(term) {
	const rows = document.querySelectorAll('#teachersTable tbody tr');
	const t = term.toLowerCase();
	rows.forEach(row => {
		const name = row.cells[1].textContent.toLowerCase();
		row.style.display = name.includes(t) ? '' : 'none';
	});
}

// Expose for onclick handlers
window.showAddTeacherModal = showAddTeacherModal;
window.closeTeacherModal = closeTeacherModal;
window.editTeacher = editTeacher;
window.deleteTeacher = deleteTeacher;
window.closeImageCropper = closeImageCropper;
window.applyImageCrop = applyImageCrop;
window.searchTeachers = searchTeachers;
