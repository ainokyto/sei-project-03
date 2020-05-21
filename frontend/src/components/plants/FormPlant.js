import React from 'react'
import Select from 'react-select'
import { getTrefleData } from '../../lib/api'
import axios from 'axios'


const uploadUrl = 'https://api.cloudinary.com/v1_1/jompra/image/upload'
const uploadPreset = 'ml_default'
const moderatorKey = 'dc0c6202b07ba22e3425ed4299d7a233'


class FormPlant extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      options: [],
      search: '',
      results: [],
      isLoading: false,
      lon: '',
      lat: '',
      test: '',
      errors: {},
      unitOptions: [
        { value: 'inches', label: 'inches' },
        { value: 'feet', label: 'feet' },
        { value: 'centimeters', label: 'centimeters' },
        { value: 'meters', label: 'meters' },
      ]
    }
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.handleItemClicked = this.handleItemClicked.bind(this)
  }

  handleSearchChange(e) {
    this.setState({
      search: e.target.value,
      isLoading: true
    })

    // Stop the previous setTimeout if there is one in progress
    clearTimeout(this.timeoutId)

    // Launch a new request in 1000ms
    this.timeoutId = setTimeout(() => {
      this.performSearch()
    }, 1000)
  }
  performSearch() {
    if (this.state.search === "") {
      this.setState({
        results: [],
        isLoading: false
      })
      return
    }
    axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${this.state.search}.json?access_token=pk.eyJ1IjoieWFyZGVuNTAiLCJhIjoiY2thNTVnOXc3MDZ0NTNvbnVvN3Nhdm1obiJ9.QbdSEysOTf3gzai-WwOSow`)
      .then(response => {
        this.setState({
          results: response.data.features,

          isLoading: false
        })
      })
  }
  handleItemClicked = async (place) => {

    const search = await place.place_name
    const lon = await place.geometry.coordinates[0]
    const lat = await place.geometry.coordinates[1]
    this.setState({
      lat: lat,
      lon: lon,
      search: search,
      results: []
    })
    console.log(this.state)
    this.props.onSelect(lat, lon)

  }

  getSciData = async () => {
    if (this.props.formData.name) {
      const sciNames = []
      const splitNames = this.props.formData.name.split(' ')
      const res = await getTrefleData(splitNames[0])
      const plantData = res.data
      plantData.forEach(obj => {
        sciNames.push({ value: obj.scientific_name, label: obj.scientific_name })
      })
      this.setState({ options: sciNames })
    }
  }

  sendData = () => {
    this.props.imageUrl(this.state.imageUrl)
  }

  handleUpload = async event => {
    const data = new FormData()
    data.append('file', event.target.files[0])
    data.append('upload_preset', uploadPreset)
    const res = await axios.post(uploadUrl, data)
    this.checkNaughtyImage(res.data.url)
    
    // console.log(this.state.imageUrl)
    
  }

  checkNaughtyImage = async (imgToCheck) => {
    const res = await axios.post(`https://api.moderatecontent.com/moderate/?key=dc0c6202b07ba22e3425ed4299d7a233&url=${imgToCheck}`)
    const modResponse = res.data.rating_letter
    if (modResponse === 'e'){
      this.setState({ imageUrl: imgToCheck })
      this.sendData()
    } else {
      window.alert('Uploaded an inappropriate image. Please keep your images Family Friendly')
    }
  }

  // console.log('props: ', this.props.formData.name)
  render() {
    const { formData, errors, handleChange, handleSubmit, buttonText, handleSelectChange, handleUnitsSelectChange } = this.props //* deconstructing all props passed by either NewPlant or EditPlant
    return (

      <div className="columns">
        <form onSubmit={handleSubmit} className="column is-half is-offset-one-quarter">
        <div className="field">
            <label className="label">Nickname</label>
            <div className="control">
              <input
                className={`input ${errors.nickName ? 'is-danger' : ''}`} // * using a ternary to attach the class "is-danger" to the input if it is present in the errors object, also only showing the small tag below.
                placeholder="Name"
                name="nickName"
                onChange={handleChange}
                value={formData.nickName}
              />
            </div>
            {errors.nickName ? <small className="help is-danger">{errors.nickName}</small> : ''}
          </div>
          <div className="field">
            <label className="label">Common-Name</label>
            <div className="control">
              <input
                className={`input ${errors.name ? 'is-danger' : ''}`} // * using a ternary to attach the class "is-danger" to the input if it is present in the errors object, also only showing the small tag below.
                placeholder="Name"
                name="name"
                onChange={handleChange}
                value={formData.name}
              />
            </div>
            {errors.name ? <small className="help is-danger">{errors.name}</small> : ''}
          </div>
          <div className="field">
            <label className="label">Height in Centimeters</label>
            <div className="control">
              <textarea
                className={`input ${errors.height ? 'is-danger' : ''}`}
                placeholder="Height"
                name="height"
                onChange={handleChange}
                value={formData.height}
              />
            </div>
            {errors.height && <small className="help is-danger">{errors.height}</small>}
          </div>

          <div className="field">
            <label className="label">Units</label>
            <div className={`control ${errors.units ? 'is-danger' : ''}`}
              onClick={this.getSciData}
            >
              <Select
                name="units"
                onChange={handleUnitsSelectChange}
                options={this.state.unitOptions}
              />
            </div>
            {errors.units && <small className="help is-danger">{errors.units}</small>}
          </div>

          <div className="field">
            <label className="label">Scientific Name</label>
            <div className={`control ${errors.scientificName ? 'is-danger' : ''}`}
              onClick={this.getSciData}
            >
              <Select
                name="scientificName"
                onChange={handleSelectChange}
                options={this.state.options}
              />
            </div>
            {errors.scientificName && <small className="help is-danger">{errors.scientificName}</small>}
          </div>
          <div className="field">
            <label className="label">Description</label>
            <div className="control">
              <textarea
                className={`textarea ${errors.description ? 'is-danger' : ''}`}
                placeholder="Describe your specific plant. We will add general descriptions for you"
                type="textarea"
                name="description"
                rows="5"
                cols="50"
                wrap="hard"
                onChange={handleChange}
                value={formData.description}
              />
            </div>
            {errors.description && <small className="help is-danger">{errors.description}</small>}
          </div>
            <div>
              <label className="label">Upload Image</label>
              <input
                className={`input ${errors.imageUrl ? 'is-danger' : ''}`}
                type="file"
                onChange={this.handleUpload}
              />
              {formData.imageUrl ? <img src={formData.imageUrl} alt="User's Upload"></img> : ''}
            </div>
            {errors.imageUrl && <small className="help is-danger">{errors.imageUrl}</small>}
          <div className="field">
            <label className="label">Location</label>
            <div className={`control ${errors.description ? 'is-danger' : ''}`}>
              <div className="AutocompletePlace">
                <input
                  className="input AutocompletePlace-input" type="text" value={this.state.search} onChange={this.handleSearchChange} placeholder="Type an address"
                />
                <ul className="AutocompletePlace-results">
                  {this.state.results.map(place => (
                    <li
                      key={place.id}
                      className="AutocompletePlace-items"
                      onClick={() => this.handleItemClicked(place)}
                    >
                      {place.place_name}
                    </li>
                  ))}
                  {this.state.isLoading && <li className="AutocompletePlace-items">Loading...</li>}
                </ul>
              </div>
            </div>
            {errors.location && <small className="help is-danger">{errors.location}</small>}
          </div>


          <div className="field">
            <button type="submit" className="button is-fullwidth is-outlined is-success">{buttonText}</button>
          </div>
        </form>
      </div>
    )
  }
}

export default FormPlant