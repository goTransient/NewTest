/* ================== GLOBAL ================== */
let stepCount = 0;
let selectedIndex = null;
let quizSets = {};
let isEditMode = false;
let editingIndex = null;


document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("moduleID").value = "3"; 
	generateQuizSetID();
	document.getElementById("moduleID").addEventListener("change", generateQuizSetID);
	document.getElementById("examType").addEventListener("change", generateQuizSetID);

	/* Builds the MCQ / Conditional UI based on the selected category */
	const category = document.getElementById("category");
	if (!category) {
	console.error("category not found");
	return;
	}
 	category.addEventListener("change", updateCategoryUI);
	updateCategoryUI(); // initial state
	
	/* Add button Actions */
	const saveBtn = document.getElementById("saveQuestionBtn");
    saveBtn.addEventListener("click", saveQuestion);	
    const questionType = document.getElementById("questionType");
    questionType.addEventListener("change", updateQuestionTypeUI);

	const exportBtn = document.getElementById("exportDataBtn");
    exportBtn.addEventListener("click", exportPDF);	

	document.getElementById("loadDataBtn").addEventListener("click", () => {
		document.getElementById("jsonFileInput").click();
    });
	document.getElementById("jsonFileInput").addEventListener("change", handleJsonFileLoad);	
		
	/* Adjust quizIntro height based on content */
	document.addEventListener("input", e => {
	  if (e.target.classList.contains("quizIntro")) {
		e.target.style.height = "auto";               // reset
		e.target.style.height = e.target.scrollHeight + "px";
	  }
	});			
	setDateToday("examDate");
});

function setDateToday(inputId) {
  const today = new Date().toISOString().split('T')[0];
  const input = document.getElementById(inputId);
  if (input) {
    input.value = today;
  }
}
function updateCategoryUI() {
  const category = document.getElementById("category");
  const mcqTypeQuestion = document.getElementById("mcqTypeQuestion");
  const mcqBody = document.getElementById("mcqBody");
  const conditionalBox = document.getElementById("conditionalBox");
  const questionType = document.getElementById("questionType");
  // Reset error message
  const msgError = document.getElementById("msgError");
  if (msgError) {
    msgError.textContent = "";
    msgError.style.display = "none";
  }  
  
  if (!mcqTypeQuestion || !mcqBody || !conditionalBox) {
    console.error("UI elements missing", {
      mcqTypeQuestion,
      mcqBody,
      conditionalBox
    });
    return;
  }
  const isMCQ = category.value === "mcq";
  mcqTypeQuestion.classList.toggle("hidden", !isMCQ);
  mcqBody.classList.toggle("hidden", !isMCQ);
  conditionalBox.classList.toggle("hidden", isMCQ);  
  if (isMCQ && questionType) {
    updateQuestionTypeUI();
  } else {
    updateConditionalTypeUI();
  }
}

/* ===== Builds the MCQ UI based on the selected question type =============== */
function updateQuestionTypeUI() {
	const type = Number(questionType.value);
	const box = document.getElementById("mcqBody");
	const options = ["A", "B", "C", "D"]

	/* type: "singleChoice" */
	if (type === 1) {
		box.innerHTML = `
			<div style="margin-top:20px;">
				<label class="form-label">Nội dung câu hỏi</label>
				<textarea class="quizIntro" id="mcqText"></textarea>
				<div class="optionContainer" id="optContainer">
					${options.map(o => `
					<div class="option">
						<label class="option-label">Phương án ${o}</label>
						<input class="clControl" id="mcq${o}">
					</div>
					`).join("")}
				</div>
				<div class="row" style="width:49%;">
					<div class="option">
						<label class="form-label">Đáp án</label>
						<select class="clControl clSelect" id="mcqCorrect">
						  ${options.map((o, i) => `<option value="${i}">${o}</option>`).join("")}
						</select>
					</div>	
					<div class="option">
						<div style="display: flex; align-items: center; gap: 4px;">
							<label class="form-label">Điểm</label>
							<label class="form-annotation">(/10)</label>
						</div>
						<input class="clControl clSelect" id="mcqScore" style="font-weight:bold; color:yellow;"	value="1">
					</div>					
				</div>					
			</div>			
	  `;
	}
	
	/* type: "imageChoice" */
	if (type === 2) {
		box.innerHTML = `
			<div style="margin-top:20px;">
				<label class="form-label">Nội dung câu hỏi</label>
				<textarea class="quizIntro" id="mcqText"></textarea>
				<div class="optionContainer" id="optContainer">
					${options.map(o => `
					<div class="option">
						<label class="option-label">Phương án ${o}</label>
						<textarea  class="image-area"  data-image-id="${o}"  placeholder="file ảnh..."  readonly></textarea>
						<input class="btnUploadImage"  type="file"  accept="image/*"  data-image-id="${o}"  id="mcqImage${o}"  hidden>
						<img class="preview-image"  data-image-id="${o}"  style="max-width:200px; display:none;">
					</div>
					`).join("")}
				</div>

				<div class="row" style="width:49%;">
					<div class="option">
						<label class="form-label">Đáp án</label>
						<select class="clControl clSelect" id="mcqCorrect">
						  ${options.map((o, i) => `<option value="${i}">${o}</option>`).join("")}
						</select>
					</div>	
					<div class="option">
						<label class="form-label">Điểm</label>
						<input class="clControl clSelect" id="mcqScore" style="font-weight:bold; color:yellow;"	value="1">
					</div>		
				</div>	
			</div>					
	  ` ;
	}	
	
	/* type: "matchingChoice" */
	if (type === 3) {
		const texts = ["1", "2", "3", "4"];
		box.innerHTML = `
			<div style="margin-top:20px;">
				<label class="form-label">Nội dung câu hỏi</label>
				<textarea class="quizIntro" id="mcqQuestion"
					placeholder="Ghép mỗi hình ảnh với mô tả tương ứng"></textarea>
				<div class="optionContainer">
					${options.map(p => `
						<div class="option">
							<textarea  class="image-area"  data-image-id="${p}"  placeholder="file ảnh..."  readonly></textarea>
							<input class="btnUploadImage"  type="file"  accept="image/*"  data-image-id="${p}"  id="mcqPhoto${p}"  hidden>
							<img class="preview-image"  data-image-id="${p}"  style="max-width:200px; display:none;">		
						</div>
					`).join("")}
				</div>
				<div class="optionContainer">
					${texts.map(t => `
						<div class="option">
							<label class="option-label">Ghi chu ${t}</label>
							<input class="clControl" id="mcqText${t}">
						</div>
					`).join("")}
				</div>
				<div class="option" style="width:23.5%;">
					<label class="form-label">Điểm</label>
					<input class="clControl clSelect" id="mcqScore" style="font-weight:bold; color:yellow;"	value="1">
				</div>		
			</div>				
		`;
	}	
}

/* ===== Builds the MCQ UI based on the selected question type =============== */
function updateConditionalTypeUI() {
  const box = document.getElementById("conditionalBox");
  if (!box) return;

  const options = ["A", "B", "C", "D"];

  box.innerHTML = `
    <label class="form-label">Nội dung câu hỏi</label>
    <textarea class="quizIntro" id="conditionalIntro"></textarea>

    <div class="tab-group">
		<div class="tab-headers">
		  <div class="tab-header active" data-tab="0">
			Bước 1 <span class="step-badge" id="badge-step1"></span>
		  </div>

		  <div class="tab-header" data-tab="1">
			Bước 2 <span class="step-badge" id="badge-step2"></span>
		  </div>

		  <div class="tab-header" data-tab="2">
			Bước 3 <span class="step-badge" id="badge-step3"></span>
		  </div>

		  <div class="tab-header" data-tab="3">
			Bước 4 <span class="step-badge" id="badge-step4"></span>
		  </div>
		</div>

      <!-- STEP 1 -->
      <div class="tab-pane active">
        <label class="form-label2">Bước 1: Chọn hình / sơ đồ đúng</label>
		<textarea class="quizIntro" id="mcqQuestion" placeholder="Cau hoi ..."></textarea>		
        <div class="optionContainer">
          ${options.map(o => `
            <div class="option">
				<label class="option-label">Phương án ${o}</label>
				<textarea  class="image-area"  data-image-id="${o}"  placeholder="file ảnh..."  readonly></textarea>
				<input class="btnUploadImage"  type="file"  accept="image/*"  data-image-id="${o}"  id="step1Img${o}"  hidden>
				<img class="preview-image"  data-image-id="${o}">			  		  
			  
            </div>
          `).join("")}
        </div>

        <div class="row" style="width:49%;">
          <div class="option">
            <label class="form-label2">Đáp án</label>
            <select class="clControl clSelect" id="step1Correct">
              ${options.map((o, i) => `<option value="${i}">${o}</option>`).join("")}
            </select>
          </div>
          <div class="option">
            <label class="form-label2">Điểm</label>			
			<input class="clControl clSelect" id="step1Score" style="font-weight:bold; color:yellow;" value="1">
          </div>
        </div>
      </div>

      <!-- STEP 2 -->
      <div class="tab-pane">
        <label class="form-label2">Bước 2: Chọn phương án đúng</label>
		<textarea class="quizIntro" id="mcqQuestion" placeholder="Cau hoi ..."></textarea>
        <div class="optionContainer">
          ${options.map(o => `
            <div class="option">
              <label class="option-label">Phương án ${o}</label>
              <input class="clControl" id="step2Opt${o}">
            </div>
          `).join("")}
        </div>

        <div class="row" style="width:49%;">
          <div class="option">
            <label class="form-label2">Đáp án</label>
            <select class="clControl clSelect" id="step2Correct">
              ${options.map((o, i) => `<option value="${i}">${o}</option>`).join("")}
            </select>
          </div>
          <div class="option">
            <label class="form-label2">Điểm</label>            
			<input class="clControl clSelect" id="step2Score" style="font-weight:bold; color:yellow;" value="1">
          </div>
        </div>
      </div>

      <!-- STEP 3 -->
      <div class="tab-pane">
        <label class="form-label2">Bước 3: Tinh cac thong so sau:</label>
		<textarea class="quizIntro" id="mcqQuestion" placeholder="Cau hoi ..."></textarea>
        <div class="optionContainer">
          ${["1", "2", "3"].map(n => `
            <div class="option">
			  <input class="clControl" id="step3VarLabelCase${n}" type="text" placeholder="Ten gia tri can tinh ...">
              <input class="clControl" id="step3VarValuesCase${n}" type="number">
            </div>
          `).join("")}
        </div>
		
        <div class="option" style="width:23.5%;">
          <label class="form-label2">Điểm</label>          
		  <input class="clControl clSelect" id="step3Score" style="font-weight:bold; color:yellow;" value="1">
        </div>
      </div>

      <!-- STEP 4 -->
      <div class="tab-pane">
        <label class="form-label2">Bước 4: Nhập kết quả cuối</label>
		<textarea class="quizIntro" id="mcqQuestion" placeholder="Cau hoi ..."></textarea>
        <div class="option" style="width:23.5%;">
          <label class="form-label2">Giá trị</label>
          <input class="clControl" id="step4Value" type="number">
        </div>

        <div class="option" style="width:23.5%;">
          <label class="form-label2">Điểm</label>          
		  <input class="clControl clSelect" id="step4Score" style="font-weight:bold; color:yellow;" value="1">
        </div>
      </div>
    </div>
  `;
  
	box.querySelectorAll(".tab-header").forEach(tab => {
	  tab.addEventListener("click", () => {
		activateTab(Number(tab.dataset.tab));
	  });
	});
  

  // ---- completion logic ----
  function markCompleted(step, completed) {
    const badge = document.getElementById(`badge-step${step}`);
    if (!badge) return;
    badge.textContent = completed ? "✔" : "";
    badge.classList.toggle("completed", completed);
  }

  function checkStepsCompletion() {
    markCompleted(1,
      options.every(o => document.getElementById(`step1Img${o}`)?.value.trim()) &&
      document.getElementById("step1Score")?.value
    );

    markCompleted(2,
      options.some(o => document.getElementById(`step2Opt${o}`)?.value.trim()) &&
      document.getElementById("step2Score")?.value
    );

    markCompleted(3,
      ["1","2","3"].every(n => document.getElementById(`step3Case${n}`)?.value !== "") &&
      document.getElementById("step3Score")?.value
    );

    markCompleted(4,
      document.getElementById("step4Value")?.value !== "" &&
      document.getElementById("step4Score")?.value
    );
  }

  box.addEventListener("input", checkStepsCompletion);
  box.addEventListener("change", checkStepsCompletion);
}

function activateTab(index) {
  document.querySelectorAll(".tab-header").forEach((t, i) =>
    t.classList.toggle("active", i === index)
  );
  document.querySelectorAll(".tab-pane").forEach((p, i) =>
    p.classList.toggle("active", i === index)
  );
}

/* -------- MCQ validation -------------------------- */
function validateMcqOptions(options, mcqType) {
  const msgError = document.getElementById("msgError");
  const mcqScoreInput = document.getElementById("mcqScore");

  if (!msgError) return true;

  const errors = [];

  /* ================== SINGLE CHOICE ================== */
  if (mcqType === "1") {
    const filled = options.map(o => o.trim()).filter(Boolean);

    if (filled.length < 2) {
      errors.push("Câu hỏi phải có ít nhất 2 lựa chọn");
    }

    if (new Set(filled).size !== filled.length) {
      errors.push("Các lựa chọn được nhập phải khác nhau");
    }
  }

  /* ================== IMAGE CHOICE ================== */
  if (mcqType === "2") {
    const filledImages = options.filter(o => o && o.trim() !== "");

    if (filledImages.length < 2) {
      errors.push("Câu hỏi phải có ít nhất 2 hình được chọn");
    }
  }

  /* ================== SCORE VALIDATION ================== */
  const rawScore = mcqScoreInput?.value.trim();
  const score = Number(rawScore);

  if (!rawScore) {
    errors.push("Điểm không được để trống");
  }
  else if (Number.isNaN(score)) {
    errors.push("Điểm phải là giá trị số");
  }
  else if (score <= 0) {
    errors.push("Điểm phải lớn hơn 0");
  }

  /* ================== DISPLAY ================== */
  if (errors.length) {
    msgError.textContent = errors.join(", ");
    msgError.style.display = "block";
    return false;
  }

  msgError.textContent = "";
  msgError.style.display = "none";
  return true;
}

function validateConditionalQuestion() {
  const errors = [];

  const intro = document.getElementById("conditionalIntro")?.value.trim();
  if (!intro) {
    errors.push("Câu hỏi chính không được để trống");
  }

  /* ===== STEP 1 ===== */
  const step1Images = ["A","B","C","D"]
    .map(o => document.getElementById(`step1Img${o}`)?.files?.[0])
    .filter(Boolean);

  const step1Score = Number(
    document.getElementById("step1Score")?.value
  );

  if (step1Images.length < 2) {
    errors.push("Bước 1: phải chọn ít nhất 2 hình");
  }
  if (!step1Score || step1Score <= 0) {
    errors.push("Bước 1: điểm phải lớn hơn 0");
  }

  /* ===== STEP 2 ===== */
  const step2Options = ["A","B","C","D"]
    .map(o => document.getElementById(`step2Opt${o}`)?.value.trim())
    .filter(Boolean);

  const step2Score = Number(
    document.getElementById("step2Score")?.value
  );

  if (step2Options.length < 2) {
    errors.push("Bước 2: cần ít nhất 2 phương án");
  }
  if (!step2Score || step2Score <= 0) {
    errors.push("Bước 2: điểm phải lớn hơn 0");
  }

  /* ===== STEP 3 ===== */
  const step3Pairs = [1,2,3].map(n => ({
    label: document.getElementById(`step3VarLabelCase${n}`)?.value.trim(),
    value: document.getElementById(`step3VarValuesCase${n}`)?.value
  })).filter(v => v.label && v.value !== "");

  const step3Score = Number(
    document.getElementById("step3Score")?.value
  );

  if (step3Pairs.length === 0) {
    errors.push("Bước 3: cần ít nhất một giá trị cần tính");
  }
  if (!step3Score || step3Score <= 0) {
    errors.push("Bước 3: điểm phải lớn hơn 0");
  }

  /* ===== STEP 4 ===== */
  const finalValue =
    document.getElementById("step4Value")?.value;

  const step4Score = Number(
    document.getElementById("step4Score")?.value
  );

  if (finalValue === "" || finalValue == null) {
    errors.push("Bước 4: phải nhập kết quả cuối");
  }
  if (!step4Score || step4Score <= 0) {
    errors.push("Bước 4: điểm phải lớn hơn 0");
  }

  /* ===== DISPLAY ERRORS ===== */
  const msgError = document.getElementById("msgError");
  if (errors.length) {
    if (msgError) {
      msgError.textContent = errors.join(" | ");
      msgError.style.display = "block";
    } else {
      alert(errors.join("\n"));
    }
    return false;
  }

  if (msgError) {
    msgError.textContent = "";
    msgError.style.display = "none";
  }

  return true;
}

/* -------- build MCQ Object -------------------------- */
function buildMcqQuestionObject(qNumber) {
  const typeVal = Number(questionType.value);

  const base = {
    qIndex: `Q${qNumber}`,
    type: "",
    questionIntro: document.querySelector(".quizIntro")?.value || "",
    text: "",
    questionType: "TYPE1",
    options: [],
    images: [],
    correctIndex: -1,
    score: Number(document.getElementById("mcqScore")?.value || 1)
  };

  /* ========== SINGLE CHOICE ========== */
  if (typeVal === 1) {
    base.type = "singleChoice";

    base.options = ["A", "B", "C", "D"]
      .map(o => document.getElementById(`mcq${o}`)?.value || "")
      .filter(v => v.trim() !== "");

    base.correctIndex = Number(document.getElementById("mcqCorrect")?.value || 0);
  }

  /* ========== IMAGE CHOICE ========== */
  if (typeVal === 2) {
    base.type = "imageChoice";

    ["A", "B", "C", "D"].forEach((o, i) => {
      const textarea = document.querySelector(`.image-area[data-image-id="${o}"]`);
      if (!textarea || !textarea.value) return;

      base.images.push({
        src: `images/${textarea.value}`,
        alt: o
      });

      base.options.push(`${textarea.value}; ${o}`);
    });

    base.correctIndex = Number(document.getElementById("mcqCorrect")?.value || 0);
  }

  /* ========== MATCHING CHOICE ========== */
  if (typeVal === 3) {
    base.type = "matchingChoice";
    ["A", "B", "C", "D"].forEach(o => {
      const img = document.querySelector(`.image-area[data-image-id="${o}"]`);
      const text = document.getElementById(`mcqText${["A","B","C","D"].indexOf(o)+1}`);
      if (img && img.value && text && text.value) {
        base.options.push(`${img.value}; ${text.value}`);
      }
    });

    base.correctIndex = -1; // matching uses evaluator
  }
  return base;
}

/* -------- build MCQ Conditional Object -------------------------- */
function buildConditionalQuestionObject(qNumber) {
  return {
    qIndex: `Q${qNumber}`,
    type: "conditional",
    questionIntro: document.getElementById("conditionalIntro")?.value || "",
    questionType: "TYPE2",
    steps: [
      {
        step: 1,
        images: ["A","B","C","D"]
		.map(o => {
		  const fileInput = document.getElementById(`step1Img${o}`);
		  return fileInput?.files?.[0]?.name;
		}).filter(Boolean),
        correctIndex: Number(document.getElementById("step1Correct")?.value || 0),
        score: Number(document.getElementById("step1Score")?.value || 0)
      },
      {
        step: 2,
        options: ["A","B","C","D"]
		.map(o => {
		  const fileInput = document.getElementById(`step2Img${o}`);
		  return fileInput?.files?.[0]?.name;
		}).filter(Boolean),
        correctIndex: Number(document.getElementById("step2Correct")?.value || 0),
        score: Number(document.getElementById("step2Score")?.value || 0)
      },
      {
        step: 3,
        values: ["1","2","3"].map(n => ({
          label: document.getElementById(`step3VarLabelCase${n}`)?.value,
          value: document.getElementById(`step3VarValuesCase${n}`)?.value
        })),
        score: Number(document.getElementById("step3Score")?.value || 0)
      },
      {
        step: 4,
        value: document.getElementById("step4Value")?.value,
        score: Number(document.getElementById("step4Score")?.value || 0)
      }
    ]
  };
}

function saveQuestion() {
  // 🔑 Read quiz set name from textarea
  const quizSetName = document
    .getElementById("quizSetID")
    ?.value
    .trim()
    .toUpperCase();

  if (!quizSetName) {
    alert("Vui lòng nhập tên bộ đề / lớp");
    return;
  }

  // ✅ Track current quiz set
  currentQuizSetID = quizSetName;

  // ✅ Create quiz set if it does not exist
  if (!quizSets[currentQuizSetID]) {
    quizSets[currentQuizSetID] = [];
  }

  let question;

  /* ================== MCQ QUESTIONS ================== */
  if (category.value === "mcq") {
    const mcqType = questionType.value; // "1" single | "2" image | "3" matching
    let options = [];

    // ✅ Single choice → text inputs
    if (mcqType === "1") {
      options = ["A", "B", "C", "D"].map(
        o => document.getElementById(`mcq${o}`)?.value || ""
      );
    }
    // ✅ Image choice → image filenames
    else {
      options = ["A", "B", "C", "D"].map(
        o =>
          document.querySelector(
            `.image-area[data-image-id="${o}"]`
          )?.value || ""
      );
    }

    // ✅ Validate MCQ by type
    if (!validateMcqOptions(options, mcqType)) {
      return;
    }

    question = buildMcqQuestionObject(
      isEditMode ? quizSets[currentQuizSetID][editingIndex].qIndex
                  : quizSets[currentQuizSetID].length + 1
    );
  }

  /* ================== CONDITIONAL QUESTIONS ================== */
  else {
    if (!validateConditionalQuestion()) {
      return;
    }

    question = buildConditionalQuestionObject(
      isEditMode ? quizSets[currentQuizSetID][editingIndex].qIndex
                  : quizSets[currentQuizSetID].length + 1
    );
  }

  /* ================== SAVE / UPDATE ================== */
  if (isEditMode && editingIndex !== null) {
    // ✅ MODIFY existing question
    quizSets[currentQuizSetID][editingIndex] = question;
  } else {
    // ✅ ADD new question
    quizSets[currentQuizSetID].push(question);
  }

  // ✅ Reset edit state
  isEditMode = false;
  editingIndex = null;

  /* ================== UPDATE UI ================== */
  renderHistory();
  updateOutput();
  resetForm();
}

/* ================== JSON TOGGLE and UPDATE ================== */
function toggleJsonOutput() {
  const output = document.getElementById("output");
  const title = document.getElementById("jsonToggle");
  const isHidden = output.classList.toggle("hidden");
  title.innerHTML = isHidden ? "▶ JSON Output" : "▼ JSON Output";
  // ✅ Ensure JSON is generated when expanding
  if (!isHidden) {    updateOutput();  }
}

function updateOutput() {
  document.getElementById("output").textContent =
    JSON.stringify(quizSets, null, 2);
}

/* ================== HISTORY / UTIL ================== */
function renderHistory() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  // Guard: no active quiz set
  if (!currentQuizSetID || !quizSets[currentQuizSetID]) {
    return;
  }

  const questions = quizSets[currentQuizSetID];

  questions.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.draggable = true;

    /* ===== Left (number + title) ===== */
    const left = document.createElement("div");
    left.className = "history-left";

    const number = document.createElement("b");
    number.textContent = `${i + 1}. `;

    const MAX_LEN = 40;
    const title = document.createElement("span");

    const intro = q.questionIntro?.trim();
    title.textContent = intro
      ? intro.slice(0, MAX_LEN) +
        (intro.length > MAX_LEN ? " …" : "")
      : `${q.type || "Question"} ${i + 1}`;

    if (intro) title.title = intro;

    left.append(number, title);

    /* ===== Buttons (Edit + Delete) ===== */
    const actions = document.createElement("div");
    actions.className = "history-actions";

    // ✏️ Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "🖊️";
    editBtn.title = "Chỉnh sửa";

    editBtn.onclick = e => {
      e.stopPropagation();
      isEditMode = true;
      editingIndex = i;
      loadQuestion(i);
    };

    // ❌ Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "❌";
    deleteBtn.title = "Xóa";

    deleteBtn.onclick = e => {
      e.stopPropagation();
      deleteQuestion(i);
    };

    actions.append(editBtn, deleteBtn);

    /* ===== Item click (view/load) ===== */
	item.onclick = () => {
	  loadQuestion(i);
	};


    /* ===== Drag & Drop ===== */
    item.ondragstart = e =>
      e.dataTransfer.setData("index", i);

    item.ondragover = e =>
      e.preventDefault();

    item.ondrop = e =>
      reorder(i, Number(e.dataTransfer.getData("index")));

    item.append(left, actions);
    historyList.appendChild(item);
  });
}

function deleteQuestion(index) {
  // ✅ Guard: no active quiz set
  if (!currentQuizSetID || !quizSets[currentQuizSetID]) {
    return;
  }
  // ✅ Remove the question
  quizSets[currentQuizSetID].splice(index, 1);

  // ✅ If no questions left → reset editor
  if (quizSets[currentQuizSetID].length === 0) {
    resetForm();
  }
  // ✅ Refresh UI
  renderHistory();
  updateOutput();
}

function reorder(targetIndex, sourceIndex) {
  // ✅ Guard: no active quiz set
  if (!currentQuizSetID || !quizSets[currentQuizSetID]) {
    return;
  }
  const list = quizSets[currentQuizSetID];

  // ✅ Guard: index sanity check (optional but safe)
  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex >= list.length ||
    targetIndex >= list.length
  ) {
    return;
  }
  // ✅ Reorder items
  list.splice(targetIndex, 0, list.splice(sourceIndex, 1)[0]);

  // ✅ Refresh UI
  renderHistory();
  updateOutput();
}

function resetForm() {
  /* ===== Reset inputs & textareas ===== */
  document.querySelectorAll(
    "#mcqBody input, #mcqBody textarea, " +
    "#conditionalBox input, #conditionalBox textarea"
  ).forEach(el => {
    el.value = "";

    // ✅ Reset textarea height to CSS default
    if (el.tagName === "TEXTAREA") {
      el.style.height = "";
    }
  });
  /* ===== Reset selects ===== */
  document.querySelectorAll(
    "#mcqBody select, #conditionalBox select"
  ).forEach(sel => {
    sel.selectedIndex = 0;
  });

  /* ===== Restore default MCQ score ===== */
  const mcqScore = document.getElementById("mcqScore");
  if (mcqScore) {
    mcqScore.value = 1;
  }
  /* ===== Clear image previews ===== */
  document.querySelectorAll(".preview-image").forEach(img => {
    img.src = "";
    img.style.display = "none";
  });
  /* ===== Reset validation error ===== */
  const msgError = document.getElementById("msgError");
  if (msgError) {
    msgError.textContent = "";
    msgError.style.display = "none";
  }
}

function loadQuestion(index) {
  if (
    !currentQuizSetID ||
    !quizSets[currentQuizSetID] ||
    !quizSets[currentQuizSetID][index]
  ) {
    console.warn("Question not found:", index);
    return;
  }
  const question = quizSets[currentQuizSetID][index];
  resetForm();

  const categorySelect = document.getElementById("category");
  const questionTypeSelect = document.getElementById("questionType");

  /* ===== CONDITIONAL ===== */
  if (question.type === "conditional") {
    categorySelect.value = "conditional";
    updateCategoryUI();

	const conditionalIntro = document.getElementById("conditionalIntro");
	if (conditionalIntro) {
	  conditionalIntro.value = question.questionIntro || "";
	  autoResizeTextarea(conditionalIntro); // ✅ adjust height
	}
	  

    /* --- Step 1 --- */
    if (question.steps?.[0]) {
      const step1 = question.steps[0];
      ["A","B","C","D"].forEach((o, i) => {
        const ta = document.querySelector(
          `.image-area[data-image-id="${o}"]`
        );
        if (ta && step1.images?.[i]) {
          ta.value = step1.images[i];
        }
      });
      document.getElementById("step1Correct").value =
        (step1.correctIndex ?? 1);
      document.getElementById("step1Score").value =
        step1.score ?? "";
    }

    /* --- Step 2 --- */
    if (question.steps?.[1]) {
      const step2 = question.steps[1];
      ["A","B","C","D"].forEach(o => {
        const el = document.getElementById(`step2Opt${o}`);
        if (el && step2.options) {
          el.value = step2.options[["A","B","C","D"].indexOf(o)] || "";
        }
      });
      document.getElementById("step2Correct").value =
        (step2.correctIndex ?? 1);
      document.getElementById("step2Score").value =
        step2.score ?? "";
    }

    /* --- Step 3 --- */
    if (question.steps?.[2]) {
      const step3 = question.steps[2];
      step3.values?.forEach((v, i) => {
        document.getElementById(`step3VarLabelCase${i+1}`).value =
          v.label || "";
        document.getElementById(`step3VarValuesCase${i+1}`).value =
          v.value || "";
      });
      document.getElementById("step3Score").value =
        step3.score ?? "";
    }

    /* --- Step 4 --- */
    if (question.steps?.[3]) {
      document.getElementById("step4Value").value =
        question.steps[3].value || "";
      document.getElementById("step4Score").value =
        question.steps[3].score || "";
    }

    return;
  }

  /* ===== MCQ ===== */
  categorySelect.value = "mcq";
  updateCategoryUI();

  /* ---- Detect MCQ subtype ---- */
  const typeMap = {
    singleChoice: 1,
    imageChoice: 2,
    matchingChoice: 3
  };

  questionTypeSelect.value = typeMap[question.type];
  updateQuestionTypeUI();

	const intro = document.getElementById("mcqText");
	if (intro) {
	  intro.value = question.questionIntro || "";
	  autoResizeTextarea(intro); // ✅ adjust height
	}	

  /* ---- Common ---- */
  document.getElementById("mcqScore").value =
    question.score ?? "";

  /* ---- Correct index (1 → 0-based) ---- */
  if (question.correctIndex != null) {
    document.getElementById("mcqCorrect").value =
      question.correctIndex ;
  }

  /* ---- Single / Image choice ---- */
  if (question.type === "singleChoice") {
    ["A","B","C","D"].forEach((o, i) => {
      const el = document.getElementById(`mcq${o}`);
      if (el) el.value = question.options?.[i] || "";
    });
  }

  if (question.type === "imageChoice") {
    question.images?.forEach((img, i) => {
      const ta = document.querySelector(
        `.image-area[data-image-id="${["A","B","C","D"][i]}"]`
      );
      if (ta) ta.value = img.src.replace("images/", "");
    });
  }

  if (question.type === "matchingChoice") {
    question.options?.forEach((opt, i) => {
      const [img, text] = opt.split(";");
      const ta = document.querySelector(
        `.image-area[data-image-id="${["A","B","C","D"][i]}"]`
      );
      if (ta) ta.value = img.trim();
      document.getElementById(`mcqText${i+1}`).value =
        text?.trim() || "";
    });
  }
}

function exportPDF(showAnswers = true) {
  saveDataToLocal();
  if (!currentQuizSetID || !quizSets[currentQuizSetID]) {
    alert("Không có dữ liệu để xuất PDF");
    return;
  }
  const questions = quizSets[currentQuizSetID];

  let html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${currentQuizSetID}</title>

	<!-- ✅ MathJax SVG renderer (LaTeX → SVG) -->
	<script>
	  window.MathJax = {
		loader: {
		  load: ['input/asciimath', 'output/svg']
		},
		asciimath: {
		  delimiters: [['$', '$']]
		},
		svg: {
		  fontCache: 'global'
		}
	  };
	</script>
	<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js"></script>  

  <style>
	@page {
	  size: A4;
	  margin: 10mm;
	}  
    body {
      font-family: "Times New Roman", serif;
      margin: 20px 10px;
      color: #000;
      line-height: 1.6;
    }

mjx-container {
  display: inline-block !important;
  overflow: visible !important;
  line-height: normal !important;
  font-size: 92% !important;
}

mjx-container svg {
  overflow: visible !important;
}

    .header { text-align: center; font-size: 18px; margin-bottom: 30px; }
    .content { display: flex; justify-content: space-between; font-size: 18px; }
    .left{ width: 56%; }, .right { width: 40%; }
    .exam-title { font-weight: bold; font-size: 20px; }
    .content-line { margin-top: 20px; border-bottom: 1.5px solid #000; }

    .question { margin-top: 15px; page-break-inside: avoid; }
    .options { margin-left: 30px; }
    .correct { font-weight: bold; margin-top: 6px; }
    .score { font-weight: bold; margin-top: 4px; }

    mjx-container { font-size: 110%; }
  </style>
</head>

<body>
  <div class="header">
    TRƯỜNG ĐẠI HỌC KINH DOANH & CÔNG NGHỆ HÀ NỘI
  </div>

  <div class="content">
    <div class="left">
      <div class="title-upcase">KHOA CƠ ĐIỆN TỬ VÀ Ô TÔ</div>
      <div>Ngành: Công nghệ kỹ thuật ô tô</div>
      <div>Học phần: Truyền động thủy lực khí nén trên ô tô</div>
      <div>Trình độ đào tạo: Đại học chính quy</div>
    </div>

    <!-- ✅ FIXED closing tag -->
    <div class="right">
      <div class="title-upcase">ĐỀ THI KẾT THÚC HỌC PHẦN</div>
      <div class="spacer">Đề thi số: 06</div>
      <div>Mã học phần: 191023080</div>
    </div>
  </div>
  <div class="content-line"></div>
`;

  questions.forEach((q, index) => {
    html += `
      <div class="question">
        <h3>Câu ${index + 1}</h3>
        <p><strong>${q.questionIntro || ""}</strong></p>
    `;

    if (q.options?.length) {
      html += `<div class="options">`;
      q.options.forEach((opt, i) => {
        html += `<div>${String.fromCharCode(65 + i)}. ${opt}</div>`;
      });
      html += `</div>`;
    }

    if (showAnswers && q.correctIndex != null) {
      html += `<div class="correct">Đáp án đúng: ${indexToLetter(q.correctIndex)}</div>`;
    }

    html += `<div class="score">Điểm: ${q.score}</div></div>`;
  });

  html += `</body></html>`;

  const win = window.open("about:blank", "_blank", "width=900,height=1000");
  win.document.write(html);
  win.document.close();

  win.onload = async () => {
    await win.MathJax.typesetPromise();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };
}

/* ================== Global handler for ALL image-textarea + file-input pairs ================== */
// Click textarea → open corresponding file input
document.addEventListener("click", (e) => {
  const textarea = e.target.closest(".image-area");
  if (!textarea) return;

  const id = textarea.dataset.imageId;
  console.log("clicked", id);
  const fileInput = document.querySelector(
    `.btnUploadImage[data-image-id="${id}"]`
  );
  fileInput?.click();  
});

// File selected → show filename in textarea + preview image
document.addEventListener("change", (e) => {
  const input = e.target.closest(".btnUploadImage");
  if (!input || !input.files[0]) return;

  const id = input.dataset.imageId;
  const file = input.files[0];

  // Update textarea with file name
  const textarea = document.querySelector(
    `.image-area[data-image-id="${id}"]`
  );
  if (textarea) textarea.value = file.name;

  // Show preview image
  const preview = document.querySelector(
    `.preview-image[data-image-id="${id}"]`
  );
  if (preview) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";           // reset
  textarea.style.height = textarea.scrollHeight + "px";
}

function indexToLetter(index) {
  return String.fromCharCode(64 + index+1); // 1 -> A, 2 -> B ...
}

function generateQuizSetID() {
    const moduleSelect = document.getElementById("moduleID");
    const examType = document.getElementById("examType").value;

    // Get selected module text
    const selectedText = moduleSelect.options[moduleSelect.selectedIndex].text;

    // Take first letter of first 3 words
    const X = selectedText
        .split(/\s+/)        // split into words
        .slice(0, 3)         // take first 3 words
        .map(word => word[0].toUpperCase())
        .join("");

    // Exam type
    const exam = examType === "1" ? "KT" : "THI";

    // Random 3-digit number (001–999)
    const randomNumber = String(
        Math.floor(Math.random() * 999) + 1
    ).padStart(3, "0");

    // Final ID
    document.getElementById("quizSetID").value =
        `${X}-${exam}-${randomNumber}`;
}

function saveDataToLocal() {
  if (!quizSets || Object.keys(quizSets).length === 0) {
    alert("Không có dữ liệu để lưu");
    return;
  }
  const dataStr = JSON.stringify(quizSets, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const filename = currentQuizSetID
    ? `${currentQuizSetID}.json`
    : "quiz-data.json";

  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function handleJsonFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);

      // ✅ Basic structure check
      if (typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid quizSets structure");
      }

      // ✅ Restore data
      quizSets = data;

      const keys = Object.keys(quizSets);
      if (!keys.length) {
        alert("Dữ liệu rỗng");
        return;
      }

      // ✅ Set active quiz set
      currentQuizSetID = keys[0];
      document.getElementById("quizSetID").value = currentQuizSetID;

      // ✅ Reset UI first
      resetForm();

      // ✅ Render history
      renderHistory();

      // ✅ Load FIRST question automatically
/*       if (quizSets[currentQuizSetID].length > 0) {
        loadQuestion(0);
      } */

      // ✅ Update JSON output panel
      updateOutput();	  
    } catch (err) {
      console.error(err);
    }
  };
  reader.readAsText(file);
  // ✅ Allow reloading the same file again
  e.target.value = "";
}