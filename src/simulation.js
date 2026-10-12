/** Educational model, NOT empirically calibrated. Thresholds illustrate sensitivity
 * to recipe, substrate water content (wet-basis mass %) and temperature. They do
 * not predict probability, incubation duration, mechanical strength or food safety.
 * Ambient relative humidity is not modeled. Real results depend on species,
 * preparation, sterilization, airflow and many other conditions.
 * Context: Haneef et al. (2017), Scientific Reports 7, 41292,
 * https://doi.org/10.1038/srep41292; Appels et al. (2019), Materials & Design 161,
 * 64–71, https://doi.org/10.1016/j.matdes.2018.11.027.
 */
export const RULES = Object.freeze({ moistureIdeal: [55, 70], moistureExtreme: [40, 80], temperatureIdeal: [20, 28], temperatureExtreme: [15, 33], coffeeLimit: 40, paperLimit: 50 });
export const MATERIALS = [
 {id:'sawdust',name:'Sawdust',label:'WOOD / STRUCTURE',description:'A lignocellulosic scaffold. Wood particles give the growing network a porous structure.',tone:'#b5956f'},
 {id:'coffee',name:'Spent coffee',label:'COFFEE / NUTRIENTS',description:'A nutrient-rich waste stream. Dense, wet grounds can limit air movement through a recipe.',tone:'#735345'},
 {id:'straw',name:'Straw',label:'FIBRE / AIRFLOW',description:'Hollow plant fibres create space for air and a framework for mycelium to bind.',tone:'#c8bc7d'},
 {id:'paper',name:'Recycled paper',label:'CELLULOSE / FIBRE',description:'A second life for cellulose. Paper absorbs water and changes the texture of a blend.',tone:'#a7b9a4'}
];
export function rebalance(recipe,id,value){
 const entries=Object.keys(recipe),others=entries.filter(k=>k!==id); if(!others.length)return recipe;
 const next={...recipe,[id]:Math.max(0,Math.min(100,Math.round(value)))};
 const remaining=100-next[id],old=others.reduce((s,k)=>s+recipe[k],0); let allocated=0;
 others.forEach((key,i)=>{next[key]=i===others.length-1?remaining-allocated:Math.round(remaining*(old?recipe[key]/old:1/others.length));allocated+=next[key];});return next;
}
export function evaluate({recipe,moisture,temperature}){
 const reasons=[];let stress=0;
 const extreme=moisture<RULES.moistureExtreme[0]||moisture>RULES.moistureExtreme[1]||temperature<RULES.temperatureExtreme[0]||temperature>RULES.temperatureExtreme[1];
 if(moisture<55){stress++;reasons.push('Low substrate moisture limits the water available to the simulated network.');}
 else if(moisture>70){stress++;reasons.push('High substrate moisture reduces modeled air space and raises an illustrative contamination risk.');}
 else reasons.push('Substrate moisture sits within the model’s illustrative growing range.');
 if(temperature<20){stress++;reasons.push('Cool incubation slows the modeled colonization.');}
 else if(temperature>28){stress++;reasons.push('Warm incubation stresses the modeled network.');}
 else reasons.push('Incubation temperature sits within the illustrative growing range.');
 if((recipe.coffee||0)>40){stress++;reasons.push('A coffee-heavy blend is modeled as dense, with less available air space.');}
 if((recipe.paper||0)>50){stress++;reasons.push('A paper-heavy blend is modeled as compact and moisture-retentive.');}
 const outcome=extreme||stress>=3?'failed':stress?'incomplete':'success';
 return {outcome,reasons,title:{success:'A new material emerges.',incomplete:'A network, unfinished.',failed:'Growth finds its limits.'}[outcome],label:{success:'Successful colonization',incomplete:'Incomplete colonization',failed:'Failed growth / contamination risk'}[outcome]};
}
