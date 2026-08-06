/* ============================================================
   dashboard.js
   ------------------------------------------------------------
   Admin Dashboard
   - Firebase Firestore Data Fetch
   - Total Applications Count
   - Search
   - Sort
   - View Details
   - Delete Application
   ============================================================ */


// ---------- AUTH CHECK ----------
if (sessionStorage.getItem(SESSION_KEY) !== "true") {
  window.location.href = "admin.html";
}


// ---------- GLOBAL DATA ----------
let allApplications = [];
let currentSearchTerm = "";
let currentSort = "latest";


document.addEventListener("DOMContentLoaded", () => {


  // ---------- ELEMENTS ----------
  const tableBody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");

  const loadingOverlay = document.getElementById("loadingOverlay");
  const toastWrap = document.getElementById("toastWrap");

  const statTotal = document.getElementById("statTotal");

  const searchInput = document.getElementById("searchInput");
  const sortFilter = document.getElementById("sortFilter");

  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");


  const modalOverlay = document.getElementById("modalOverlay");
  const modalBody = document.getElementById("modalBody");
  const modalCloseBtn = document.getElementById("modalCloseBtn");


  loadingOverlay.classList.add("show");



  // ============================================================
  // FIRESTORE LISTENER
  // ============================================================

  db.collection(LEAVE_COLLECTION)
    .orderBy("createdAt","desc")
    .onSnapshot((snapshot)=>{


      allApplications = snapshot.docs.map(doc=>({

        id:doc.id,
        ...doc.data()

      }));


      loadingOverlay.classList.remove("show");

      renderStats();
      renderTable();


    },(error)=>{


      console.log(error);

      loadingOverlay.classList.remove("show");

      showToast(
        "Firebase data load failed",
        "error"
      );


    });




  // ============================================================
  // TOTAL COUNT
  // ============================================================

  function renderStats(){

    statTotal.textContent =
    allApplications.length;

  }




  // ============================================================
  // SEARCH + SORT
  // ============================================================

  function getFilteredApplications(){

    let list=[...allApplications];


    if(currentSearchTerm.trim() !== ""){


      let text=currentSearchTerm
      .toLowerCase();


      list=list.filter(app=>


        (app.studentName || "")
        .toLowerCase()
        .includes(text)

        ||

        (app.rollNumber || "")
        .toLowerCase()
        .includes(text)


      );

    }



    list.sort((a,b)=>{


      let aTime =
      a.createdAt?.toMillis ?
      a.createdAt.toMillis():0;


      let bTime =
      b.createdAt?.toMillis ?
      b.createdAt.toMillis():0;



      return currentSort==="latest"
      ?
      bTime-aTime
      :
      aTime-bTime;


    });


    return list;

  }





  // ============================================================
  // TABLE DISPLAY
  // ============================================================

  function renderTable(){


    const list=getFilteredApplications();



    if(list.length===0){

      tableBody.innerHTML="";

      emptyState.classList.remove("hidden");

      return;

    }


    emptyState.classList.add("hidden");



    tableBody.innerHTML=list.map(app=>{


      return `

<tr>


<td>${escapeHtml(app.studentName)}</td>

<td>${escapeHtml(app.rollNumber)}</td>

<td>${escapeHtml(app.class)}</td>

<td>${escapeHtml(app.department)}</td>

<td>${escapeHtml(app.mobile)}</td>


<td>
${formatDate(app.leaveFrom)}
</td>


<td>
${formatDate(app.leaveTo)}
</td>


<td>
${app.totalDays || "-"}
</td>


<td>
${escapeHtml(app.reason)}
</td>


<td>

<button 
class="btn view btn-sm"
data-action="view"
data-id="${app.id}">

<i class="fa-solid fa-eye"></i>

</button>



<button
class="btn delete btn-sm"
data-action="delete"
data-id="${app.id}">

<i class="fa-solid fa-trash"></i>

</button>


</td>


</tr>


`;



    }).join("");



  }





  // ============================================================
  // BUTTON ACTIONS
  // ============================================================


  tableBody.addEventListener("click",async(e)=>{


    const btn=e.target.closest("button[data-action]");


    if(!btn)return;



    const id=btn.dataset.id;


    const action=btn.dataset.action;



    const app=
    allApplications.find(x=>x.id===id);



    if(!app)return;




    if(action==="view"){

      openDetailsModal(app);

    }



    if(action==="delete"){


      let ok=confirm(
      "Delete this application?"
      );


      if(ok){

        await deleteApplication(id);

      }


    }



  });







  // ============================================================
  // DELETE
  // ============================================================


  async function deleteApplication(id){


    try{


      await db.collection(
        LEAVE_COLLECTION
      )
      .doc(id)
      .delete();



      showToast(
      "Application deleted",
      "success"
      );


    }
    catch(err){


      console.log(err);


      showToast(
      "Delete failed",
      "error"
      );


    }


  }






  // ============================================================
  // VIEW MODAL
  // ============================================================


  function openDetailsModal(app){


    modalBody.innerHTML=`

<h3>${escapeHtml(app.studentName)}</h3>

<p>
<b>Roll No:</b>
${escapeHtml(app.rollNumber)}
</p>


<p>
<b>Class:</b>
${escapeHtml(app.class)}
</p>


<p>
<b>Department:</b>
${escapeHtml(app.department)}
</p>


<p>
<b>Mobile:</b>
${escapeHtml(app.mobile)}
</p>


<p>
<b>Email:</b>
${escapeHtml(app.email || "-")}
</p>


<p>
<b>Leave From:</b>
${formatDate(app.leaveFrom)}
</p>


<p>
<b>Leave To:</b>
${formatDate(app.leaveTo)}
</p>


<p>
<b>Total Days:</b>
${app.totalDays}
</p>


<p>
<b>Reason:</b>
${escapeHtml(app.reason)}
</p>


`;


modalOverlay.classList.add("show");


}





modalCloseBtn.addEventListener(
"click",
()=>{

modalOverlay.classList.remove("show");

});





modalOverlay.addEventListener(
"click",
(e)=>{


if(e.target===modalOverlay){

modalOverlay.classList.remove("show");

}


});






// ============================================================
// SEARCH
// ============================================================


searchInput.addEventListener(
"input",
(e)=>{


currentSearchTerm=e.target.value;

renderTable();


});





// ============================================================
// SORT
// ============================================================


sortFilter.addEventListener(
"change",
(e)=>{


currentSort=e.target.value;

renderTable();


});






// ============================================================
// REFRESH
// ============================================================


refreshBtn.addEventListener(
"click",
()=>{


renderStats();

renderTable();


});






// ============================================================
// LOGOUT
// ============================================================


logoutBtn.addEventListener(
"click",
()=>{


sessionStorage.removeItem(
SESSION_KEY
);


window.location.href="admin.html";


});







// ============================================================
// HELPERS
// ============================================================


function showToast(message,type="success"){


const toast=document.createElement("div");


toast.className=
`toast ${type}`;


toast.innerHTML=
`
<span>${message}</span>
`;


toastWrap.appendChild(toast);



setTimeout(()=>{

toast.remove();

},3000);



}





function formatDate(date){


if(!date)return "-";


return new Date(date)
.toLocaleDateString(
"en-IN",
{
day:"2-digit",
month:"short",
year:"numeric"
}
);


}





function escapeHtml(str){


if(!str)return "";


const div=document.createElement("div");


div.textContent=str;


return div.innerHTML;


}



});