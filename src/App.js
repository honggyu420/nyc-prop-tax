import React, { Component } from 'react';
// import {Container, Row, Col} from 'react-bootstrap'
import './App.css';
import DataChart from './components/datachart'
import AddressForm from './components/address_form'
import PropertyInfo from './components/property_info'
import CalculatedTaxInfo from './components/calculated_tax_info'
import AggregateReport from './components/aggregate_report';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      geoclient_json: null,
      property_tax_json: null,
      agg_result: null,
    }

    this.handleAddressSubmit = this.handleAddressSubmit.bind(this);
  }

  handleAddressSubmit(geoclient_json, property_tax_json, agg_result) {
    this.setState({geoclient_json, property_tax_json, agg_result})
  }

  render() {
    const {property_tax_json, agg_result} = this.state;

    return (
      <div className="App">
        <br></br>
        <h1>NYC Property Tax Data Explorer</h1>
        <br></br>
        <AddressForm handleAddressSubmit={this.handleAddressSubmit}></AddressForm>
        <br></br>
        <PropertyInfo property_tax_data={property_tax_json}></PropertyInfo>
        <br></br>
        <DataChart property_tax_data={property_tax_json}></DataChart>
        <br></br>
        <br></br>
        <CalculatedTaxInfo property_tax_data={property_tax_json}></CalculatedTaxInfo>
        <br></br>
        <AggregateReport agg_result={agg_result}></AggregateReport>
        <br></br>
      </div>
    );
  }
}

export default App;
