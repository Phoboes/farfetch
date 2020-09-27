import React, { Component } from "react";
import PokemonIndex from "./pages/PokemonIndex";
import './App.css';

class App extends Component {
  state = {
    response: '',
    post: '',
    responseToPost: '',
  };

//   componentDidMount() {
//     this.callAPI()
//       .then( (res)=>{
//         // debugger
//         this.setState({ response: res.data })
//       })
//       .catch(err => console.log(err));
//   }

// callAPI = async() =>{
//   const response = await fetch('/api/pokemon');
//   const body = await response.json();

//   if (response.status !== 200) throw Error(body.message);

//   return body;
// }


render() {
  return (
    <div className = "App" >
      <PokemonIndex/>
    </div>
  );
}

}
export default App;
