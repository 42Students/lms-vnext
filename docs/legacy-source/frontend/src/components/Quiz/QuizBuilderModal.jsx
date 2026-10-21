import React from "react";
import dayjs from "dayjs";
import Router from "next/router";
import { wallClockToDayjs } from "@/utils/dateUtils";
import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, Radio, Select, Space, Switch, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { createQuizV2, getQuizV2, updateQuizV2 } from "@/api/Services/quizServices";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const defaultQuestion = () => ({
  type: "SINGLE_CHOICE",
  prompt: "",
  points: 1,
  options: [
    { text: "", correct: true },
    { text: "", correct: false },
  ],
});

function normalizeQuestions(questions = []) {
  return questions.map((question, questionIndex) => {
    const normalizedOptions = question.options || [];
    const correctIndexes = new Set(
      normalizedOptions
        .map((option, optionIndex) => option?.correct ? optionIndex : null)
        .filter(index => index != null)
    );
    return {
      type: question.type,
      prompt: question.prompt,
      points: question.points ?? 1,
      sequence: questionIndex,
      options: normalizedOptions.map((option, optionIndex) => ({
        text: option.text,
        correct: correctIndexes.has(optionIndex),
      })),
    };
  });
}

export default function QuizBuilderModal({ open, onClose, onCreated, onDirtyChange, lesson, courseId, classId, quizId, metadataOnly = false }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const savingRef = React.useRef(false);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);
  const [loadRetryKey, setLoadRetryKey] = React.useState(0);
  const [dirty, setDirty] = React.useState(false);
  const [contentScope, setContentScope] = React.useState("ALL");
  const [targetClassId, setTargetClassId] = React.useState(Number(classId || 0));
  const [classOptions, setClassOptions] = React.useState([]);
  const [classesLoading, setClassesLoading] = React.useState(false);
  const [classesError, setClassesError] = React.useState(null);
  const [classesRetryKey, setClassesRetryKey] = React.useState(0);
  const [loadedQuiz, setLoadedQuiz] = React.useState(null);
  const isEditMode = quizId != null;
  // Due date as loaded for an edit, so an already-closed quiz stays editable (title, attempts...)
  // without forcing its deadline forward.
  const originalDueAtRef = React.useRef(null);
  const preservedClassId = Number(loadedQuiz?.classId || loadedQuiz?.class_id || 0);
  const editClassLabel = classOptions.find((option) => Number(option.value) === preservedClassId)?.label;
  const editVisibilityLabel = preservedClassId > 0
    ? `One specific section · ${editClassLabel || `Class ${preservedClassId}`}`
    : "All currently eligible sections for this course";

  React.useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  React.useEffect(() => {
    if (!open || !dirty || savingRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved quiz changes?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved quiz changes.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [open, dirty]);


  const normalizeDueAt = React.useCallback((value) => {
    if (!value) return null;
    if (dayjs.isDayjs(value)) {
      return value.second(0).millisecond(0).format("YYYY-MM-DDTHH:mm:ss");
    }
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    return trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setSaveError(null);
    setDirty(false);
    savingRef.current = false;
    setSaving(false);
    if (!isEditMode) {
      setLoadedQuiz(null);
      setLoadError(null);
      form.setFieldsValue({
        title: "",
        dueAt: null,
        publish: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        questions: [defaultQuestion()],
      });
      const initialClassId = Number(classId || 0);
      setTargetClassId(initialClassId);
      setContentScope(initialClassId > 0 ? "SPECIFIC" : "ALL");
      setDirty(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    getQuizV2(quizId, { includeCorrectAnswers: true })
      .then((quiz) => {
        const data = quiz?.data ?? quiz;
        if (!data || (data?.id == null && data?.quizId == null && data?.quiz_id == null)) {
          throw new Error("Quiz detail response was empty");
        }
        setLoadedQuiz(data);
        // Author-typed wall-clock; may arrive as an array, which plain dayjs() reads as Invalid Date.
        originalDueAtRef.current = wallClockToDayjs(data?.dueAt);
        form.setFieldsValue({
          title: data?.title || "",
          dueAt: wallClockToDayjs(data?.dueAt),
          maxAttempts: data?.maxAttempts ?? data?.max_attempts ?? 1,
          publish: data?.status === "PUBLISHED",
          // Without these an edit would silently reset both toggles to off, because the payload
          // always sends them and an unset form field reads as false.
          shuffleQuestions: data?.shuffleQuestions === true,
          shuffleOptions: data?.shuffleOptions === true,
          questions: (data?.questions?.length ? data.questions : [defaultQuestion()]).map((q) => ({
            type: q.type,
            prompt: q.prompt,
            points: q.points ?? 1,
            options: (q.options || []).map((o) => ({ text: o.text, correct: o.correct })),
          })),
        });
        const historicalClassId = Number(data?.classId || data?.class_id || 0);
        setTargetClassId(historicalClassId);
        setContentScope(historicalClassId > 0 ? "SPECIFIC" : "ALL");
        setDirty(false);
      })
      .catch((error) => {
        setLoadedQuiz(null);
        setLoadError(error?.response?.data?.message || error?.message || "Unable to load quiz for editing");
      })
      .finally(() => setLoading(false));
  }, [open, isEditMode, quizId, form, classId, loadRetryKey]);

  React.useEffect(() => {
    if (!open) return;
    const resolvedCourseId = Number(
      isEditMode
        ? (loadedQuiz?.courseId || loadedQuiz?.course_id || courseId || 0)
        : (courseId || 0)
    );
    if (!resolvedCourseId) {
      setClassOptions([]);
      setClassesError(null);
      return;
    }
    let cancelled = false;
    setClassOptions([]);
    setClassesLoading(true);
    setClassesError(null);
    getClassesForCourseSyllabus({
      courseId: resolvedCourseId,
      ...(isEditMode && preservedClassId > 0 ? { includeHistoricalClassId: preservedClassId } : {}),
    })
      .then((classes) => {
        if (cancelled) return;
        const options = Object.entries(classes && typeof classes === "object" ? classes : {})
          .filter(([id]) => id !== "undefined" && Number(id) > 0)
          .map(([id, name]) => ({ value: Number(id), label: name || `Class ${id}` }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setClassOptions(options);
        setClassesError(null);
      })
      .catch((error) => {
        if (!cancelled) {
          setClassOptions([]);
          setClassesError(error?.response?.data?.message || "Could not load eligible sections for this course.");
        }
      })
      .finally(() => { if (!cancelled) setClassesLoading(false); });
    return () => { cancelled = true; };
  }, [open, isEditMode, loadedQuiz, courseId, preservedClassId, classesRetryKey]);

  const requestClose = () => {
    if (saving) return;
    if (!dirty) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: isEditMode ? "Discard quiz changes?" : "Discard this quiz draft?",
      content: "Your unsaved changes will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setDirty(false);
        onClose?.();
      },
    });
  };

  const saveQuiz = async values => {
    if (savingRef.current || saving) return;
    if (isEditMode && (loadError || !loadedQuiz)) {
      message.error("Reload the quiz before saving changes.");
      return;
    }
    if (!isEditMode && (!lesson?.lessonId || !courseId)) {
      message.error("Lesson and course are required to create a quiz.");
      return;
    }
    if (!isEditMode && contentScope === "SPECIFIC" && !(Number(targetClassId) > 0)) {
      message.error("Select a specific eligible section or choose all eligible sections.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        lessonId: isEditMode ? Number(loadedQuiz?.lessonId || loadedQuiz?.lesson_id || lesson?.lessonId || 0) : Number(lesson?.lessonId || 0),
        courseId: isEditMode ? Number(loadedQuiz?.courseId || loadedQuiz?.course_id || courseId || 0) : Number(courseId || 0),
        classId: isEditMode
          ? preservedClassId
          : (contentScope === "SPECIFIC" ? Number(targetClassId) : 0),
        title: values.title,
        dueAt: normalizeDueAt(values.dueAt),
        maxAttempts: values.maxAttempts ?? 1,
        publish: values.publish !== false,
        // Audit 2.7: per-quiz randomisation, off unless the author asks for it.
        shuffleQuestions: values.shuffleQuestions === true,
        shuffleOptions: values.shuffleOptions === true,
        // A nonempty questions list is a destructive rewrite server-side. Once attempts
        // exist, omit questions entirely so metadata edits do not erase answer history.
        questions: isEditMode && metadataOnly ? [] : normalizeQuestions(values.questions),
      };
      if (isEditMode) {
        await updateQuizV2(quizId, payload);
        message.success(payload.publish
          ? "Quiz updated and published. Learners can attempt it until the due date."
          : "Quiz updated as a draft. Publish it when it is ready for learners.");
      } else {
        await createQuizV2(payload);
        message.success(payload.publish
          ? "Quiz created and published. Learners can attempt it until the due date."
          : "Quiz created as a draft. Publish it when it is ready for learners.");
      }
      setDirty(false);
      onCreated?.();
      onClose?.();
    } catch (err) {
      const fieldError = applyServerFieldErrors(form, err, {
        title: "title", due_at: "dueAt", dueAt: "dueAt", max_attempts: "maxAttempts", maxAttempts: "maxAttempts",
      });
      const errorMessage = getServerFormError(err, `Unable to ${isEditMode ? "update" : "create"} quiz`);
      setSaveError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const closedDeadlineLocked = Boolean(
    isEditMode
      && originalDueAtRef.current
      && originalDueAtRef.current.isBefore(dayjs())
  );

  return (
    <Modal
      open={open}
      title={isEditMode ? "Edit quiz" : "Create quiz"}
      onCancel={requestClose}
      footer={null}
      width={"min(820px, 94vw)"}   /* capped so it is usable below 820px viewports */
      destroyOnClose
      className="quiz-builder-modal ln-mobile-safe-modal"
      wrapClassName="ln-mobile-safe-modal-wrap"
      confirmLoading={loading}
      maskClosable={!saving}
      closable={!saving}
      keyboard={!saving}
    >
      {saveError ? (
        <Alert
          type="error"
          showIcon
          message={isEditMode ? "Quiz changes were not saved" : "Quiz was not created"}
          description={saveError}
          closable
          onClose={() => setSaveError(null)}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      {isEditMode && loadError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Could not load this quiz for editing"
          description={loadError}
          action={<Button size="small" onClick={() => setLoadRetryKey((value) => value + 1)}>Retry</Button>}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={saveQuiz}
        disabled={loading || saving || (isEditMode && Boolean(loadError))}
        onValuesChange={() => setDirty(true)}
      >
        {!isEditMode && (
          <Alert
            type="info"
            showIcon
            className="quiz-builder-modal__context"
            message="This quiz will be added to"
            description={lesson?.lessonName || "No lesson selected"}
          />
        )}
        <Form.Item name="title" label="Quiz title" rules={[{ required: true, message: "Enter a quiz title" }]}>
          <Input placeholder="Example: Java basics checkpoint" />
        </Form.Item>
        <Space align="start" wrap>
          <Form.Item
            name="dueAt"
            label="Due date"
            extra={isEditMode && metadataOnly
              ? "Locked after learner submissions so assessment conditions cannot change retroactively."
              : closedDeadlineLocked
                ? "This quiz is already closed. Its deadline cannot be moved forward."
                : undefined}
            rules={[
              { required: true, message: "Set a due date" },
              {
                // A past due date used to be accepted here and then refused by the server
                // ("Cannot publish a quiz after its due date") -- or saved as a draft no learner
                // could ever take. Unchanged dates on an edit are allowed.
                validator: (_, value) => {
                  const original = originalDueAtRef.current;
                  if (!value || (original && value.isSame(original, "minute"))) return Promise.resolve();
                  return value.isAfter(dayjs())
                    ? Promise.resolve()
                    : Promise.reject(new Error("Pick a due date and time in the future"));
                },
              },
            ]}
          >
            <DatePicker
              disabled={(isEditMode && metadataOnly) || closedDeadlineLocked}
              disabledDate={(current) => current && current < dayjs().startOf("day")}
              showTime={{ format: "HH:mm" }}
              format="DD MMM YYYY, hh:mm A"
              minuteStep={5}
              placeholder="Select due date"
            />
          </Form.Item>
          <Form.Item
            name="maxAttempts"
            label="Attempts"
            initialValue={1}
            extra={isEditMode && metadataOnly ? "Locked after learner submissions so a new attempt cannot be granted after answers may have been revealed." : undefined}
            rules={[{ required: true, message: "Set allowed attempts" }]}
          >
            <InputNumber min={1} max={20} disabled={isEditMode && metadataOnly} />
          </Form.Item>
        <Form.Item
          name="shuffleQuestions"
          label="Shuffle question order per learner"
          valuePropName="checked"
          extra={isEditMode && metadataOnly
            ? "Locked after learner submissions so the assessment presentation cannot change mid-run."
            : "Every learner otherwise sees the same order, so one learner's answer sequence works for the whole room. Each learner keeps a stable order across refreshes."}
        >
          <Switch disabled={isEditMode && metadataOnly} />
        </Form.Item>

        <Form.Item
          name="shuffleOptions"
          label="Shuffle answer options per learner"
          valuePropName="checked"
          extra={isEditMode && metadataOnly
            ? "Locked after learner submissions so the assessment presentation cannot change mid-run."
            : "Answers are matched by option, not position, so shuffling never affects grading."}
        >
          <Switch disabled={isEditMode && metadataOnly} />
        </Form.Item>

        <Form.Item name="publish" label="Publish now" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>
        {isEditMode ? (
          <Form.Item label="Audience">
            <span style={{ color: "#8c8c8c" }}>{editVisibilityLabel}</span>
          </Form.Item>
        ) : (
          <>
            <Form.Item label="Audience">
              <Radio.Group
                value={contentScope}
                onChange={(event) => {
                  const next = event.target.value;
                  setContentScope(next);
                  setDirty(true);
                  if (next === "ALL") setTargetClassId(0);
                }}
              >
                <Radio value="ALL">All currently eligible sections for this course</Radio>
                <Radio value="SPECIFIC" disabled={Boolean(classesError)}>One specific section</Radio>
              </Radio.Group>
            </Form.Item>
            {classesError && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Eligible sections unavailable"
                description={classesError}
                action={<Button size="small" onClick={() => setClassesRetryKey((value) => value + 1)}>Retry sections</Button>}
              />
            )}
            {contentScope === "SPECIFIC" ? (
              <Form.Item
                label="Specific section"
                extra={classesError
                  ? "Section eligibility could not be verified."
                  : classesLoading && !classOptions.length
                    ? "Loading sections…"
                    : classOptions.length
                    ? `${classOptions.length} current section${classOptions.length === 1 ? "" : "s"} available.`
                    : "No current section is eligible for this course."}
              >
                <Select
                  loading={classesLoading}
                  options={classOptions}
                  // Until the sections load, the bare id ("9") showed as the value under "No current section is eligible".
                  value={targetClassId > 0 && classOptions.some((o) => o.value === Number(targetClassId)) ? Number(targetClassId) : undefined}
                  onChange={(value) => { setTargetClassId(value); setDirty(true); }}
                  disabled={Boolean(classesError)}
                  placeholder={classesError ? "Sections unavailable" : "Select an eligible section"}
                  showSearch
                  filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            ) : (
              <div style={{ marginTop: -8, marginBottom: 16, color: "#8c8c8c" }}>
                Shared quizzes are visible only to sections currently entitled to this course.
              </div>
            )}
          </>
        )}
      </Space>

        {(!isEditMode || !metadataOnly) ? (
        <Form.List name="questions">
          {(fields, { add, remove }) => (
            <div className="quiz-builder-modal__questions">
              {fields.map((field, index) => (
                <div className="quiz-builder-modal__question" key={field.key}>
                  <div className="quiz-builder-modal__question-head">
                    <strong>Question {index + 1}</strong>
                    {fields.length > 1 && (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => { remove(field.name); setDirty(true); }}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <Form.Item name={[field.name, "prompt"]} label="Question" rules={[{ required: true, message: "Enter the question" }]}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Space align="start" wrap size={16} className="quiz-builder-modal__type-points">
                    <Form.Item name={[field.name, "type"]} label="Type" rules={[{ required: true, message: "Choose a question type" }]}>
                      <Radio.Group>
                        <Radio.Button value="SINGLE_CHOICE">Single choice</Radio.Button>
                        <Radio.Button value="MULTIPLE_CHOICE">Multiple choice</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name={[field.name, "points"]} label="Points" rules={[{ required: true, message: "Set question points" }]}>
                      <InputNumber min={1} max={100} />
                    </Form.Item>
                  </Space>

                  <Form.List name={[field.name, "options"]}>
                    {(optionFields, optionOps) => (
                      // Reading form.getFieldValue(...type) directly in JSX doesn't subscribe to
                      // that field's changes — the Radio.Group above has its own Form.Item and
                      // re-renders fine on click, but this sibling block never did, so switching
                      // to "Multiple choice" left the old single-select Radio in place instead of
                      // a Switch. shouldUpdate forces a re-render of this subtree specifically
                      // when this question's type changes.
                      <Form.Item noStyle shouldUpdate={(prev, cur) =>
                        prev?.questions?.[field.name]?.type !== cur?.questions?.[field.name]?.type
                      }>
                        {() => (
                          <div className="quiz-builder-modal__options">
                            {optionFields.map((optionField, optionIndex) => (
                              <Space key={optionField.key} className="quiz-builder-modal__option" align="baseline">
                                {(form.getFieldValue(["questions", field.name, "type"]) || "SINGLE_CHOICE") === "SINGLE_CHOICE" ? (
                                  <Radio
                                    checked={((form.getFieldValue(["questions", field.name, "options"]) || []).findIndex(option => option?.correct) === optionIndex)}
                                    onChange={() => {
                                      const nextOptions = ((form.getFieldValue(["questions", field.name, "options"]) || [])).map((option, idx) => ({
                                        ...option,
                                        correct: idx === optionIndex,
                                      }));
                                      form.setFieldValue(["questions", field.name, "options"], nextOptions);
                                      setDirty(true);
                                    }}
                                  />
                                ) : (
                                  <Form.Item name={[optionField.name, "correct"]} valuePropName="checked">
                                    <Switch size="small" />
                                  </Form.Item>
                                )}
                                <Form.Item
                                  name={[optionField.name, "text"]}
                                  rules={[{ required: true, message: "Enter option text" }]}
                                >
                                  <Input placeholder={`Option ${optionIndex + 1}`} />
                                </Form.Item>
                                {optionFields.length > 2 && (
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined aria-hidden />}
                                    aria-label={`Remove option ${optionIndex + 1} from question ${index + 1}`}
                                    onClick={() => { optionOps.remove(optionField.name); setDirty(true); }}
                                  />
                                )}
                              </Space>
                            ))}
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => { optionOps.add({ text: "", correct: false }); setDirty(true); }}
                            >
                              Add option
                            </Button>
                          </div>
                        )}
                      </Form.Item>
                    )}
                  </Form.List>
                </div>
              ))}
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => { add(defaultQuestion()); setDirty(true); }} block>
                Add question
              </Button>
            </div>
          )}
        </Form.List>
        ) : (
          <Alert type="info" showIcon message="Questions, deadline, attempt limit and randomization are locked after learner submissions. Title and description can still be corrected." />
        )}

        <div className="quiz-builder-modal__footer">
          <Button onClick={requestClose} disabled={saving}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving} disabled={saving || (isEditMode && Boolean(loadError))}>
            {isEditMode ? "Save changes" : "Create quiz"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
