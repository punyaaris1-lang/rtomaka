if(!localStorage.getItem('maka_user')){
 localStorage.setItem('maka_user',JSON.stringify({
  name:'User MAKA',
  plate:'B 0000 XX'
 }))
}

function getUser(){
 return JSON.parse(localStorage.getItem('maka_user'))
}
