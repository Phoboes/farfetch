import React, {
    Component
} from "react";

class PokemonIndex extends Component {
    state = {
        pokemon: '',
    };

    componentDidMount() {
        this.callAPI()
            .then((res) => {
                this.setState({
                    pokemon: res.data
                })
            })
            .catch(err => console.log(err));
    }

    callAPI = async () => {
        const response = await fetch('/api/pokemon');
        const body = await response.json();

        if (response.status !== 200) throw Error(body.message);

        return body;
    }


    render() {
        if( this.state.pokemon ){
            return ( <
                    div > {
                        this.state.pokemon.map((thisPokemon) => {
                                return ( < img key={thisPokemon._id} alt ={thisPokemon.name}
                                    src = {
                                        thisPokemon.images[0]
                                    }
                                    />)
                                })
                        } <
                        /div>
                    );
        } else {
            return (<p>Loading...</p>)
        }
    }

}
export default PokemonIndex;
