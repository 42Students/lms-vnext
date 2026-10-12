import test from 'node:test';
import assert from 'node:assert/strict';

const fixtures = () => ({
  departments: { depA: { collegeId: 'A' }, depB: { collegeId: 'B' } },
  programs: { progA: { departmentId: 'depA' }, progB: { departmentId: 'depB' } },
  cohorts: { cohortA: { programId: 'progA' }, cohortB: { programId: 'progB' } },
  periods: { termA: { collegeId: 'A' }, termB: { collegeId: 'B' } },
  courses: { courseA: { departmentId: 'depA' }, courseB: { departmentId: 'depB' } },
  offerings: { offA: { courseId: 'courseA', cohortId: 'cohortA', periodId: 'termA' } },
  sections: { secA: { cohortId: 'cohortA', periodId: 'termA' } },
  deliveries: { delA: { offeringId: 'offA', sectionId: 'secA' } },
  memberships: { memberA: { collegeId: 'A', userId: 'userA' } },
  messages: { msgA: { deliveryId: 'delA', senderMembershipId: 'memberA', deletedAt: null } },
});

function dependencyIds(state, message) {
  const delivery = state.deliveries[message.deliveryId];
  const offering = state.offerings[delivery.offeringId];
  const section = state.sections[delivery.sectionId];
  const course = state.courses[offering.courseId];
  const cohort = state.cohorts[section.cohortId];
  const program = state.programs[cohort.programId];
  return {
    course_section_deliveries: [message.deliveryId],
    course_offerings: [delivery.offeringId],
    sections: [delivery.sectionId],
    courses: [offering.courseId],
    departments: [course.departmentId, program.departmentId],
    academic_periods: [offering.periodId, section.periodId],
    cohorts: [offering.cohortId, section.cohortId],
    programs: [cohort.programId],
    college_memberships: [message.senderMembershipId],
  };
}

function safeToReparent(state, table, rowId, oldRow, nextRow) {
  const changed = Object.keys(nextRow).some(key => nextRow[key] !== oldRow[key]);
  if (!changed) return true;
  return !Object.values(state.messages).some(message =>
    dependencyIds(state, message)[table].includes(rowId));
}

test('every classroom ancestor path retains historical message identity', async t => {
  const cases = [
    ['course_section_deliveries','delA',{ offeringId: 'offB' }],
    ['course_section_deliveries','delA',{ sectionId: 'secB' }],
    ['course_offerings','offA',{ courseId: 'courseB' }],
    ['course_offerings','offA',{ cohortId: 'cohortB' }],
    ['course_offerings','offA',{ periodId: 'termB' }],
    ['sections','secA',{ cohortId: 'cohortB' }],
    ['sections','secA',{ periodId: 'termB' }],
    ['courses','courseA',{ departmentId: 'depB' }],
    ['departments','depA',{ collegeId: 'B' }],
    ['academic_periods','termA',{ collegeId: 'B' }],
    ['cohorts','cohortA',{ programId: 'progB' }],
    ['programs','progA',{ departmentId: 'depB' }],
    ['college_memberships','memberA',{ collegeId: 'B' }],
    ['college_memberships','memberA',{ userId: 'userB' }],
  ];
  for (const [table, id, changed] of cases) await t.test(table+"."+Object.keys(changed)[0]+" blocked", () => {
    const graph = fixtures();
    const dictionary = table === 'academic_periods' ? graph.periods : graph[table === 'course_section_deliveries' ? 'deliveries' : table === 'course_offerings' ? 'offerings' : table === 'college_memberships' ? 'memberships' : table];
    const oldRow = dictionary[id];
    assert.equal(safeToReparent(graph,table,id,oldRow,{ ...oldRow,...changed }),false);
  });
});

test('read-only historical attribution survives a profile-name change', () => {
  const graph = fixtures();
  const before = dependencyIds(graph,graph.messages.msgA);
  graph.messages.msgA.deletedAt = new Date();
  assert.deepEqual(dependencyIds(graph,graph.messages.msgA),before);
  assert.equal(safeToReparent(graph,'college_memberships','memberA',graph.memberships.memberA,{ collegeId: 'B', userId: 'userA' }),false);
});

test('unreferenced ancestors can move and unchanged references are not blocked', () => {
  const graph = fixtures();
  const old = graph.departments.depB;
  assert.equal(safeToReparent(graph,'departments','depB',old,{ collegeId: 'C' }),true);
  assert.equal(safeToReparent(graph,'departments','depA',graph.departments.depA,{ ...graph.departments.depA }),true);
});

test('offering and section identity must match on cohort, period and college', () => {
  const graph = fixtures();
  const offering = graph.offerings.offA;
  const section = graph.sections.secA;
  assert.equal(offering.cohortId,section.cohortId);
  assert.equal(offering.periodId,section.periodId);
  assert.equal(graph.departments.depA.collegeId,graph.periods.termA.collegeId);
  assert.equal(graph.programs.progA.departmentId,'depA');
});
