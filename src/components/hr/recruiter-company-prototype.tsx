import Link from "next/link";
import {recruiterCompanyHiringDisplay} from "@/modules/placements/recruiter-company-unified-prototype-model";
import type {RecruiterReportRow} from "@/modules/placements/recruiter-company-reports-model";
import styles from "./recruiter-company-prototype.module.css";
type TeamMember={userId:string;displayName:string|null;email:string|null;title:string|null;isYou:boolean};
type Choice={collegeId:string;collegeName:string};
export function RecruiterCompanyPrototype({
 companyName,website,industry,about,hiringFor,logoUrl,verified,domains,
 collegeName,collegeId,choices,team,rows,reportAvailable,hasMore,
 reportHref,csvHref,teamCounts,teamCountsAvailable,
}:{
 companyName:string;website:string|null;industry:string|null;about:string|null;
 hiringFor:readonly string[];logoUrl:string|null;
 verified:boolean;domains:readonly string[];collegeName:string;collegeId:string;
 choices:readonly Choice[];team:readonly TeamMember[];rows:readonly RecruiterReportRow[];
 reportAvailable:boolean;hasMore:boolean;reportHref:string;csvHref:string;
 teamCounts:Readonly<Record<string,number>>;teamCountsAvailable:boolean;
}){
 const hiring=recruiterCompanyHiringDisplay(rows);
 const safeWebsite=website&&/^https:\/\/[^\s]+$/i.test(website)?website:null;
 return <div className={styles.root} data-testid="recruiter.company.prototype">
  {choices.length>1?<nav aria-label="Choose your college relationship" className={styles.colleges}>
    {choices.map(item=><Link key={item.collegeId}
      aria-current={item.collegeId===collegeId?"page":undefined}
      href={"/hr/company?collegeId="+encodeURIComponent(item.collegeId)}
      className={styles.college}>{item.collegeName}</Link>)}
  </nav>:null}
  <header className={styles.head}>
    <p>In {collegeName}</p>
    <h1>{companyName}{verified?<span className={styles.verified}>✓ Verified</span>:null}</h1>
    <p>What {collegeName} sees about your company, your team here, and your hiring at {collegeName}.</p>
  </header>
  <div className={styles.grid}>
    <div className={styles.left}>
     <section className={styles.panel} aria-label="Your company">
      <h2 className={styles.eyebrow}>YOUR COMPANY</h2>
      <div className={styles.companyRow}>
       {logoUrl?<img src={logoUrl} alt="" className={styles.logo} width={58} height={58}/>:
        <span className={styles.logo}>{companyName.slice(0,1).toUpperCase()}</span>}
       <div><strong className={styles.companyName}>{companyName}</strong>
        <p className={styles.muted}>{industry||"Industry not recorded"}</p></div>
      </div>
      <dl className={styles.facts}>
        <div><dt>Name</dt><dd>{companyName}</dd></div>
        <div><dt>Website</dt><dd>{safeWebsite?<a href={safeWebsite} rel="noreferrer">{safeWebsite}</a>:website||"Not recorded"}</dd></div>
        <div><dt>About</dt><dd>{about?.trim()||"Not recorded"}</dd></div>
        <div><dt>Hiring for</dt><dd>{hiringFor.length?hiringFor.join(", "):"No currently published roles at this college"}</dd></div>
        <div><dt>Work email domains</dt><dd>{domains.length?domains.map(value=>"@"+value.replace(/^@/,"")).join(", "):"Not recorded"}</dd></div>
      </dl>
      <p className={styles.muted}>Your placement cell manages company details and its trusted domains. Ask them to correct a name, logo or website.</p>
     </section>
     <section className={styles.panel} aria-label="Your team">
      <div className={styles.sectionHead}><h2 className={styles.eyebrow}>YOUR TEAM AT {collegeName.toLocaleUpperCase("en-IN")} · {team.length}</h2>
       <Link href={"/hr/conversations?collegeId="+encodeURIComponent(collegeId)} className={styles.link}>
        Request an invite ›
       </Link>
      </div>
      {team.length?<ul className={styles.team}>
       {team.map(member=><li key={member.userId}>
         <span className={styles.avatar} aria-hidden="true">{(member.displayName||member.email||"R").slice(0,1).toUpperCase()}</span>
         <div className={styles.teamWords}><strong>{member.displayName||member.email||"Recruiter"}{member.isYou?" (you)":""}</strong>
           <span>{member.title||"Recruiter"}</span>
           <small>{member.email??"Work email unavailable"}</small>
           <small>{teamCountsAvailable?(teamCounts[member.userId]??0)+" recorded drives at this college":"Drive attribution unavailable"}</small>
         </div>
       </li>)}
      </ul>:<p className={styles.muted}>Team data is not available. Ask the placement cell to verify access.</p>}
      <p className={styles.muted}>The placement cell approves new teammates; opening Messages does not send an invitation.</p>
     </section>
    </div>
    <section className={styles.panel} aria-label="Your hiring at this college">
      <div className={styles.sectionHead}><h2 className={styles.eyebrow}>YOUR HIRING AT {collegeName.toLocaleUpperCase("en-IN")}</h2>
       <Link href={reportHref} className={styles.link}>Full report ›</Link>
      </div>
      {!reportAvailable?<p role="alert" className={styles.muted}>Hiring metrics could not be verified. Open Full report to retry; unavailable counts are not zero.</p>:
       hiring.length?<div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th>DRIVE</th><th>APPLIED</th><th>CLEARED</th><th>OFFERED</th><th>JOINED</th><th>RATE</th></tr></thead>
        <tbody>{hiring.map(row=><tr key={row.id}><th scope="row"><Link href={"/recruiter/drives/"+encodeURIComponent(row.id)}>{row.title}</Link><small>{row.status==="PUBLISHED"?"Live":"Closed"}</small></th>
          <td>{row.applied}</td><td title="Cleared-round counts are not verified in this report">—</td>
          <td>{row.offered}</td><td>{row.joined}</td><td>{row.joiningRate===null?"—":row.joiningRate+"%"}</td>
        </tr>)}</tbody></table></div>:<p className={styles.muted}>No authorized published or closed hiring drives at this college.</p>}
      {reportAvailable?<p className={styles.muted}>
       Cleared-round counts are unavailable in this source. Rates are joined applicants divided by applications.
       {hasMore?" Only the first 10 recent drives appear here; the report contains the rest.":""}
      </p>:null}
      <div className={styles.exports}>
        <Link className={styles.export} href={reportHref}>See detailed hiring report</Link>
        {reportAvailable?<a className={styles.export} href={csvHref}>Download as CSV</a>:null}
      </div>
    </section>
   </div>
  </div>;
}
