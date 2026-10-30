import {randomUUID} from "node:crypto";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {shuffleQuizForLearner} from "../../src/modules/courses/learner-quiz-shuffle-model";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Quiz closure requires authorized, disposable PostgreSQL browser testing");

async function login(context:BrowserContext,role:"FACULTY"|"LEARNER"){
 const faculty=role==="FACULTY";
 await context.addCookies([
  {name:"lms_role",value:role,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:faculty?"seed-shared-faculty":"seed-learner",
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:faculty?SEED_IDS.facultyCollegeAMembership:SEED_IDS.learnerCollegeAMembership,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}

for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty quiz "+view.name+" registered shuffle, failed read recovery and attempted learner review",
 async({page,context,browser})=>{
  test.setTimeout(150_000);
  await login(context,"FACULTY");
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  const commandPath="/api/courses/faculty/quizzes/"+deliveryId+"/command";
  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  const title="Faculty shuffle closure "+view.name+" "+randomUUID().slice(0,8);
  await expect(page.getByRole("heading",{name:"Choice-question quiz builder"})).toBeVisible();
  await page.getByRole("textbox",{name:"Quiz title"}).fill(title);
  const first=page.getByRole("group",{name:"Question 1",exact:true});
  await first.getByRole("textbox",{name:"Prompt"}).fill("The even number?");
  await first.getByRole("textbox",{name:"Option 1"}).fill("Two");
  await first.getByRole("textbox",{name:"Option 2"}).fill("Three");
  await page.getByRole("button",{name:"Add question",exact:true}).click();
  const second=page.getByRole("group",{name:"Question 2",exact:true});
  await second.getByRole("textbox",{name:"Prompt"}).fill("The prime number?");
  await second.getByRole("textbox",{name:"Option 1"}).fill("Five");
  await second.getByRole("textbox",{name:"Option 2"}).fill("Six");
  await page.getByRole("checkbox",{name:"Shuffle question order per learner"}).check();
  await page.getByRole("checkbox",{name:"Shuffle answer options per learner"}).check();
  await page.getByRole("textbox",{name:"Due date (IST, required before publishing)"})
   .fill(new Date(Date.now()+14*86400000).toISOString().slice(0,16));
  await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
  const creating=page.waitForResponse(r=>r.request().method()==="POST" &&
   new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await creating;
  expect(created.status(),await created.text()).toBe(200);
  const payload=await created.json().catch(()=>null);
  const id:string=payload?.quiz?.id;
  expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(payload.quiz.shuffleQuestions).toBe(true);
  expect(payload.quiz.shuffleOptions).toBe(true);

  // Exercise a real transient 503 while loading the persisted bank. No
  // draft save/publish may proceed on an unknown answer-key state.
  await page.reload();
  let injected=false;
  await page.route("**/api/courses/quizzes/*",async route=>{
   if(!injected&&route.request().method()==="GET"&&
      new URL(route.request().url()).pathname==="/api/courses/quizzes/"+id){
     injected=true;
     await route.fulfill({status:503,contentType:"application/json",
      body:'{"error":"SERVICE_UNAVAILABLE"}'});
   }else await route.continue();
  });
  await page.getByRole("combobox",{name:"Quiz",exact:true}).selectOption(id);
  await expect(page.getByRole("button",{name:"Reload Quiz questions"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Save draft"})).toBeDisabled();
  await page.getByRole("button",{name:"Reload Quiz questions"}).click();
  await expect(page.getByRole("button",{name:"Reload Quiz questions"})).toHaveCount(0);
  await expect(page.getByRole("textbox",{name:"Prompt"}).first()).toHaveValue("The even number?");
  await expect(page.getByRole("checkbox",{name:"Shuffle question order per learner"})).toBeChecked();
  await expect(page.getByRole("checkbox",{name:"Shuffle answer options per learner"})).toBeChecked();
  await page.unrouteAll({behavior:"wait"});

  const publishedResponse=page.waitForResponse(r=>r.request().method()==="POST"&&
    new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Publish",exact:true}).click();
  const published=await publishedResponse;
  expect(published.status()).toBe(200);
  expect((await published.json()).quiz?.status).toBe("PUBLISHED");

  const facultyRead=await context.request.get("/api/courses/quizzes/"+id+
    "?deliveryId="+deliveryId+"&includeCorrectAnswers=true");
  expect(facultyRead.status()).toBe(200);
  const author=(await facultyRead.json()).quiz;
  expect(author.quiz.shuffleQuestions).toBe(true);
  expect(author.quiz.shuffleOptions).toBe(true);
  expect(author.questions).toHaveLength(2);
  for(const q of author.questions)
    expect(q.options.filter((o:{correct?:boolean})=>o.correct===true)).toHaveLength(1);

  const learnerContext=await browser.newContext({baseURL:"http://localhost:3000"});
  try {
   await login(learnerContext,"LEARNER");
   const url="/api/courses/quizzes/"+id+
     "?deliveryId="+deliveryId+"&includeCorrectAnswers=true";
   const once=await learnerContext.request.get(url);
   expect(once.status(),await once.text()).toBe(200);
   const learner=(await once.json()).quiz;
   const twice=await learnerContext.request.get(url);
   expect(twice.status()).toBe(200);
   const learnerAgain=(await twice.json()).quiz;
   expect(learner.questions).toEqual(learnerAgain.questions);
   expect(learner.questions).toHaveLength(2);
   for(const q of learner.questions)
    for(const option of q.options) expect(option).not.toHaveProperty("correct");
   // The learner endpoint must actually honor persisted flags and preserve
   // original IDs for scoring, not just accept the UI checkboxes.
   expect(learner.questions).toEqual(
    shuffleQuizForLearner(author.questions,id,SEED_IDS.learnerCollegeAMembership,true,true));
   const answerKey=author.questions.map((q:{id:string;options:Array<{id:string;correct?:boolean}>})=>({
     questionId:q.id,selectedOptionIds:q.options.filter(o=>o.correct).map(o=>o.id),
   }));
   const submission=await learnerContext.request.post("/api/courses/quizzes/"+id+"/submit",{
    data:{deliveryId,answers:answerKey,shownQuestionIds:learner.questions.map((q:{id:string})=>q.id)},
   });
   expect(submission.status(),await submission.text()).toBe(200);
   expect((await submission.json()).attempt?.attemptNumber).toBe(1);
   // Learner cannot read or edit the Faculty question bank even after an attempt.
   const beforeRelease=await learnerContext.request.get(url);
   expect(beforeRelease.status()).toBe(200);
   for(const q of (await beforeRelease.json()).quiz.questions)
    for(const option of q.options)expect(option).not.toHaveProperty("correct");
  }finally {await learnerContext.close();}

  const reviewed=await context.request.get("/api/courses/quizzes/"+id+
   "?deliveryId="+deliveryId+"&includeCorrectAnswers=true");
  expect(reviewed.status()).toBe(200);
  expect((await reviewed.json()).editPolicy?.attemptCount).toBe(1);
  await page.goto("/teacher/allQuizzes");
  await page.getByRole("combobox",{name:"Status"}).selectOption("PUBLISHED");
  await page.getByRole("textbox",{name:"Search assessments"}).fill(title);
  const card=page.locator("article").filter({has:page.getByRole("heading",{name:title})});
  await expect(card).toBeVisible();
  await card.locator("summary").filter({hasText:/^Actions/}).click();
  await card.getByRole("button",{name:"Submissions"}).click();
  const drawer=page.getByRole("dialog",{name:title+" — Submissions"});
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("No submissions yet")).toHaveCount(0);
  await expect(drawer).toContainText("1");
  const forbidden=await context.request.post(commandPath,{
   data:{action:"ARCHIVE",quizId:id,expectedUpdatedAt:author.quiz.updatedAt,confirmed:true},
  });
  expect(forbidden.status()).toBeGreaterThanOrEqual(400);
  if(view.name==="mobile"){
   expect(await page.evaluate(()=>document.documentElement.scrollWidth))
     .toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
