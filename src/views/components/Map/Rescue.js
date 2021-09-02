import React, {Component } from 'react';
import { View, Text, Image,StyleSheet,TouchableOpacity,ScrollView,SafeAreaView,Alert,Modal} from 'react-native';
import { Container, Header, Content, Form, Item, Input, Label,Button, Toast, Icon, ListItem, CheckBox, Body,Switch } from 'native-base';
import { image, config, _showErrorMessage, _showSuccessMessage, Loader, _storeUser,_getAll, _storeData, _retrieveData,checkNet } from 'assets';
import styles from './styles';
import ImagePicker from 'react-native-image-picker';
import { saveProductInfo,getUser,searchParcelAddress,postData } from 'api';
import CustomHeader from '../../CustomHeader';
import geolocation from '@react-native-community/geolocation';

import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { flashon, flashoff } from '../../../store/actions/index.js';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import { openDatabase } from 'react-native-sqlite-storage';
var db = openDatabase({ name: 'UserDatabase.db' });

import NetInfo from "@react-native-community/netinfo";

class LoadMain extends Component {
constructor(props) {
    super(props);

     db.transaction(function (txn) {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='table_stops'",
        [],
        function (tx, res) {
          console.log('item:', res.rows.length);
          if (res.rows.length == 0) {
            txn.executeSql('DROP TABLE IF EXISTS table_stops', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS table_stops(id INTEGER PRIMARY KEY AUTOINCREMENT, barcode VARCHAR(20), stop_id INT(10), address VARCHAR(255), customer_name VARCHAR(255),company_id VARCHAR(255),street_address VARCHAR(255),city VARCHAR(255),province VARCHAR(255),postal_code VARCHAR(255),email_address VARCHAR(255),phone_number VARCHAR(255),sync_status VARCHAR(10),is_exception_case VARCHAR(10),exception_case_pics VARCHAR(255),customer_address VARCHAR(255),delivery_status VARCHAR(15),reason_id INT(10),comment VARCHAR(255),gps_long VARCHAR(255),gps_lat VARCHAR(255),place_img VARCHAR(255),signature_img TEXT,sign_by VARCHAR(255),door_knocker_pic VARCHAR(255),door_knocker_barcode VARCHAR(255),apt_number VARCHAR(100),building_img VARCHAR(255),process_status VARCHAR(10),pod_photo_3 VARCHAR(255),pod_photo_4 VARCHAR(255),pod_photo_5 VARCHAR(255),shipper_number VARCHAR(255),person_name VARCHAR(100))',
              []
            );
          }
        }
      );
    }); 

    this.state = {
      isloading: false,
      isShowScanner:false,
      barcodes:'',
      customer_name:'',
      address:'',
      city:'',
      province:'',
      postal_code:'',
      email_address:'',
      phone_number:'',
      company_id:null,
      company_name:null,
      loadId:'',
      user_avtar:'',
      date:'',
      street_number:'',
      subpremise:'',
      route:'',
      searchText:'Search',
      street_address:null,
      is_exception_case:false,
      exception_case_pics:null,
      netStatus:0,
      showShipperNo:true,
      shipper_number:'',
      apt_unit_number:'',
      driverKitAlert:false,
      door_knocker_pad_title:'Have you taken canpar door knocker pad?',
      apt_pkg_pic:null,
      sequence_number:0,
      is_submit:true
    };

  }

  showNextPage = (_state) => {
    this.setState({
            [_state]: this.state[_state]
        });
  }




    componentDidMount = () => {
       const _this = this;
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
        
    this.setState({
        barcodes:'',
        customer_name:'',
        address:'',
        city:'',
        province:'',
        subpremise:'',
        postal_code:'',
        email_address:'',
        phone_number:'',
        street_address:null,
        searchText:'Search',
        street_address:null,
        is_exception_case:false,
        exception_case_pics:null,
        netStatus:0,
        sequence_number:0,
        shipper_number:'',
        apt_unit_number:'',
        is_submit:true,
      });



        _retrieveData('companyId')
        .then((res) => {
          if(res != null){
            this.setState({company_id:res});
          }
        });

        _retrieveData('companyName')
        .then((res) => {
          if(res != null){
            this.setState({company_name:res})
          }
        }); 

         _retrieveData('user_avtar')
        .then((res) => {
          if(res != null){
            this.setState({user_avtar:res});
          }
        });
    });

      getUser()
          .then((res) => {
            this.setState({
              loadId: res.scanner_id,
              date:res.date,
              door_knocker_pad_title:res.door_knocker_pad_title,
            });
        }); 
  };



    componentWillUnmount() {
    this._unsubscribe();
  }


  removeParcel() {
    //const allbarcodes = this.state.barcodes.filter((item, i) => item !== code);
    this.setState({ barcodes: null });
  }

  scanCode() {

     this.setState({
          isShowScanner: true
      });
  }

  goToLoad() {
     this.setState({
            isShowScanner: false
        });
  }



  
saveData = () => {
  const _this = this;
  this.setState({ isloading: true });
  var postdata = { barcode:this.state.barcodes };
    postData(postdata,'save_rescue_package').then((res) => {
    console.log(res);
    this.setState({ isloading: false });
      if(res.type == 1) {
      _showSuccessMessage(res.message );
      _this.props.navigation.navigate('ScanParcel');
      } else {
      _showErrorMessage(res.message);
      }
    }).catch(error => {
      this.setState({isloading:false});
      _showErrorMessage(error.message);      
    });
}


    onScannerSuccess = e => {
    const _this = this;
    const { data } = e;
      this.setState({
          barcode: '',
          isloading: true
        }, () => {
          // console.log(data);
            if (data) {
              // call api to get vehicle number from 
              var postdata = { barcode: String(data) };
              //let images = this.state.barcodes;
              //images.push(String(data));

              var barcode = String(data);
              if(barcode.includes('*')){
                    this.setState({ isloading: false });
                     _showErrorMessage('Oops wrong barcode. Please scan barcode that start without  *');
              } else {

              this.setState({ barcodes: String(data) });
              this.setState({isShowScanner: false,isloading: false});
                setTimeout(function(){
                _this.findAddress();
                }, 2000);

              }
            } else {
                this.setState({ isloading: false });
                  Alert.alert(
                'Invalid Bar Code',
                'This Bar code is not Parcel code.',
                [
                  { text: 'OK', onPress: () => console.log('OK Pressed') },
                ],
                { cancelable: false },
              );
            }
        })
  }



    findAddress = () => {
     NetInfo.fetch().then(state => {
      if(state.isConnected == false) {
        return false;
       } else {

    this.setState({isloading:true});
    var postdata = { barcode:this.state.barcodes };
     postData(postdata,'scan_rescue_package').then((res) => {
      console.log(res);
      if(res.type == 1) {
        _showSuccessMessage(res.message);
        this.setState({
          showShipperNo:false,
          isloading:false,
          customer_name:res.data.customer_name,
          email_address:res.data.email_address,
          city:res.data.city,
          province:res.data.province,
          postal_code:res.data.postal_code,
          address:res.data.address,
          apt_unit_number:res.data.apt_unit_number,
          phone_number:res.data.phone_number,
          sequence_number:res.data.sequence_number,
          is_submit:false
        });
      } else {
        _showErrorMessage(res.message);
        this.setState({
          showShipperNo:true,
          isloading:false,
          customer_name:'',
          address:'',
          city:'',
          province:'',
          postal_code:'',
          email_address:'',
          phone_number:'',
          street_address:null,
          sequence_number:0,
          searchText:'Search',
          is_submit:true
        });
      }
    });
      }
     });
    }


  refreshPage() {
    this.props.navigation.push('LoadMain');
  }

  render() {
    const {
      container,
      headerLogo,
      headerView,
      backButton,
      backSection,
      backIcon,
      nextIcon,
      backText,
      mainContainer,
      itemLabel,
      itemValue,
      itemValue1,
      itemSection,
      checkbox,
      checkbox1,
      nextSection,
      blockSection,
      blockText,
      itemMain,
      spaceDivider,
      nextText,
      nextButton,
      itemMainSub
    } = styles;

    const {
      checked,
      setChecked,
      garbage,
      cleaning,
      accessories,
      fuel_tank,
      oil_change,tire_pressure,brakes,
      no_evidence_flood_damage,
      body_panel_inspection,bumper_fascia_inspection,
      doors_hood_roof_inspection,
      doors_hood_alignment,
      power_sliding_door_operation,
      windshield_side_rear_window_glass_inspection,
      wiper_blade_inspection,
      exterior_lights_back_side_front,showShipperNo} = this.state;
     
    return (
      
      <Container>
         <Modal animationType="slide" transparent={true} visible={this.state.driverKitAlert}>
        <View style={styles1.centeredView}>
          <View style={styles1.modalView}>
            <View style={{alignSelf:'center',padding:10}}>
            <Text style={{fontSize:18, fontWeight:'bold'}}>ALERT</Text>
            </View>
            <View style={{ flexDirection: 'row',alignSelf:'center', padding:10}}>
              <Text style={{fontSize:15, fontWeight:'bold',color: 'red'}}>{this.state.door_knocker_pad_title}</Text>
            </View>  
            <View style={{ flexDirection: 'row',alignSelf:'center', padding:15}}>
              <Button disabled={this.state.is_submit}
                style={{ height: 30, width:'30%', backgroundColor: '#00c2f3', justifyContent: 'center', borderRadius: 5}}
                onPress={() => this.updateKitAns()}>
                <Text style={{ textAlign: 'center', color: '#fff', fontSize: 16 }}>YES</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

       { (this.state.isShowScanner) ?
      (<Content padder>
            <CustomHeader {...this.props} url={this.state.user_avtar} />
          <View style={{ height: 40, borderColor: '#00c2f3', borderWidth: 1, backgroundColor: '#00c2f3',marginTop: 30,marginBottom:25, marginLeft: 20, marginRight: 20, justifyContent: 'center'}}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems:'center'}} onPress={() => this.goToLoad()}>
                <Icon type="FontAwesome" name='angle-left' style={{ color: '#fff',marginLeft: 20,fontWeight: 100}}/>
                <Text style={{color:"#fff",fontWeight:'bold',marginTop:(Platform.OS == 'ios') ? -4 : 0, fontSize: 22,padding:10,textAlign:'center',paddingLeft:'4%'}}>SCAN PARCEL CODE</Text>
              </TouchableOpacity>
            </View>
            <View style={{flexDirection:'row', justifyContent:'space-between',marginLeft: 20, marginRight: 20}}>
              <Text style={{color:'black',fontSize:18,}}>Flash Light</Text>
              <Switch onValueChange={ (value) => {value == true?this.props.flashon():this.props.flashoff()}} 
                value={this.props.flashstatus == 'torch'?true:false} /> 
            </View> 
          <View style={{flexDirection:'row',paddingTop:15}}>
          <QRCodeScanner
            markerStyle={{height: 120,width: 290}}
            cameraStyle={{ height: 220, marginTop: 10, width: 300, alignSelf: 'center', justifyContent: 'center', overflow: 'hidden' }}
            onRead={ (e) => this.onScannerSuccess(e) }
                reactivate={true}
                flashMode={this.props.flashstatus == 'torch'?RNCamera.Constants.FlashMode.torch:RNCamera.Constants.FlashMode.off}
                showMarker={true}
                reactivateTimeout={7000}
            />
            </View>
      </Content>
      ):null
      }

     
       { (!this.state.isShowScanner && this.state.company_id) ?   
      (<Content>
         
            <CustomHeader {...this.props} url={this.state.user_avtar} />
          <View style={backSection}>
            <Text style={{color:"#fff",fontWeight:'bold',marginTop:(Platform.OS == 'ios') ? 1 : 0, fontSize: 22,padding:10,textAlign:'center',paddingLeft:'4%'}}>RESCUE {this.state.company_name || 'CANPAR'}</Text>
            <TouchableOpacity onPress={() => this.refreshPage()}>
            <Icon style={{color:'#fff',right:8,fontWeight:200}} name='sync' />
          </TouchableOpacity>
        </View>
          <View style={{paddingLeft:10,paddingRight:10}}>
          <View style={{flexDirection:'row',paddingTop:15}}>
          <View style={{flexDirection:'row',width:'50%'}}>
            <Text style={{fontSize:18,fontWeight:'bold'}}>Load:</Text>
            <Text style={{paddingLeft:10,fontSize:20}}>{this.state.loadId}</Text>
          </View>
            <View style={{flexDirection:'row-reverse',width:'50%'}}>
              <Text style={{fontSize:18,fontWeight:'bold'}}>{this.state.date}</Text>
            </View>
          </View>

          <View style={{borderColor: '#00c2f3',borderWidth: 1, marginTop:12}}>
          </View>



            <View style={mainContainer}>
            <View>
              <View style={{ borderRadius: 15,alignItems: 'center',justifyContent:'center',marginTop:15}}>
                <Button small onPress={() => this.scanCode()}  style={{backgroundColor: '#00c2f3',width:'99%',alignSelf:'center',alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:'#fff',fontWeight:'bold', fontSize: 14,textAlign:'center',alignSelf:'center'}}>SCAN PARCEL</Text>
                <Icon name='scan' />
                </Button>
              </View>
              <View style={{ marginTop: 10, alignItems:'center'}}>
                 <Text style={{ textAlign: 'center', fontSize: 14}}>OR</Text>
              </View>    
              <Form>
                  <Item stackedLabel>
                    <Label error={true} style={{ fontWeight: 'bold' }}>Enter Parcel Code Here</Label>
                  <Item>
                        <Input placeholder="Enter Parcel Code" value={this.state.barcodes} onChangeText={(barcodes) => this.setState({ barcodes: barcodes })}/>
                        <TouchableOpacity onPress={() => this.findAddress()}>
                    <Icon  type="FontAwesome" name='search' style={{ color: '#00c2f3'}}/>
                  </TouchableOpacity>
                  </Item>
                </Item>
              </Form>
          </View>

          <View style={{borderColor: '#00c2f3',borderWidth: 1, marginTop:12}}>
          </View>

            <Form>
                  <Item stackedLabel>
                    <Label error={true} style={{ fontWeight: 'bold' }}>Customer Name</Label>
                    <Item style={{ borderBottomColor: '#00c2f3'}}>
                      <Icon  type="FontAwesome" name='user' style={{ color: '#00c2f3'}}/>
                      <Input editable={false} placeholder="Enter Customer Name" value={this.state.customer_name} onChangeText={(customer_name) => this.setState({ customer_name: customer_name })}/>
                    </Item>

                  </Item>

                   <Item stackedLabel>
                    <Label style={{ fontWeight: 'bold' }}>Customer Address</Label>
                    <Item style={{ borderBottomColor: '#00c2f3'}}>
                      <Icon type="FontAwesome" name='map-marker' style={{ color: '#00c2f3'}}/>
                      <Input editable={false} placeholder="Address" value={this.state.address}  />
                                         
                    </Item>
                  </Item> 
                  <Item stackedLabel>
                <Label style={{ fontWeight: 'bold' }}>Apt/Unit</Label>
                <Item style={{ borderBottomColor: '#00c2f3'}}>
                  <Icon type="FontAwesome" name='map-marker' style={{ color: '#00c2f3'}}/>
                  <Input editable={false} placeholder="Apt/Unit" value={this.state.apt_unit_number} keyboardType = 'numeric' onChangeText={(apt_unit_number) => this.onChangedAptUnit(apt_unit_number)}/>
                </Item>
              </Item>
              
              
                  <Item stackedLabel>
                    <Label style={{ fontWeight: 'bold' }}></Label>
                  </Item>

                    <Label style={{ fontSize:15, fontWeight: 'bold',marginLeft:12,color:'#595959' }}>City/Province/Postal</Label>
                  <Item >
                    <Item style={{ borderBottomColor: '#00c2f3', width:'35%'}}>
                      <Input editable={false} placeholder="City" value={this.state.city} onChangeText={(city) => this.setState({ city: city })}/>
                      </Item>

                      <Item style={{ borderBottomColor: '#00c2f3',width:'25%',marginLeft:15}}>
                      <Input editable={false} style={{paddingLeft:10}} placeholder="Province" value={this.state.province} onChangeText={(province) => this.setState({ province: province })}/>
                      </Item>

                      <Item style={{ borderBottomColor: '#00c2f3',width:'25%',marginLeft:40}}>
                      <Input editable={false} placeholder="Postal" value={this.state.postal_code} onChangeText={(postal_code) => this.setState({ postal_code: postal_code })}/>
                      </Item>
                  </Item>

                  <Item stackedLabel>
                    <Label style={{ fontWeight: 'bold' }}>Email</Label>
                    <Item style={{ borderBottomColor: '#00c2f3'}}>
                      <Icon type="FontAwesome" name='envelope' style={{ color: '#00c2f3'}}/>
                      <Input editable={false} placeholder="Enter Customer Email" value={this.state.email_address} onChangeText={(email_address) => this.setState({ email_address: email_address })}/>
                    </Item>
                  </Item>

                   <Item stackedLabel>
                    <Label style={{ fontWeight: 'bold' }}>Phone</Label>
                    <Item style={{ borderBottomColor: '#00c2f3'}}>
                      <Icon type="FontAwesome" name='phone' style={{ color: '#00c2f3'}}/>
                      <Input editable={false} maxLength={10} placeholder="Enter Customer Phone" keyboardType = 'numeric' value={this.state.phone_number} onChangeText={(phone_number) => this.setState({ phone_number: phone_number })}/>
                    </Item>
                  </Item>
                </Form>
             </View>

             <View style={{marginTop: 10}}>
                <Text style={{alignSelf:'center',fontSize:20,fontWeight:'bold',color:'#054b8b'}}>STOP NUMBER : {this.state.sequence_number}</Text>
            </View>
         
          <View style={{ flexDirection: 'row', marginTop: 5,justifyContent:'space-between'}}>
              <Button style={{ height: 50, width:'48%',marginTop: 20, backgroundColor: '#00c2f3', justifyContent: 'center', borderRadius: 5}}
                    onPress={() => this.saveData()} disabled={this.state.isloading?true:false}>
                    <Text style={{ textAlign: 'center', color: '#fff', fontSize: 22 }}>Submit</Text>
              </Button>
             
              <Button style={{ height: 50, width:'48%',marginTop: 20, backgroundColor: 'white', borderColor:'#00c2f3', borderWidth:1, justifyContent: 'center', borderRadius: 5}}
                    onPress={() => this.props.navigation.navigate('ScanParcel')}>
                    <Text style={{ textAlign: 'center', color: 'black', fontSize: 22 }}>Cancel</Text>
              </Button>
          </View>
          </View>
          <View style={spaceDivider}></View>

          </Content>):null
        }
        {this.state.isloading && (
              <Loader />
          )}
        </Container>


    );
  }
}


const styles1 = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    borderColor: '#00c2f3',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
});

function mapStateToProps(state){
  return{
    flashstatus : state.flashstatus
  };
}
function matchDispatchToProps(dispatch){
  return bindActionCreators({flashon: flashon, flashoff: flashoff}, dispatch)
}
export default connect(mapStateToProps,matchDispatchToProps)(LoadMain);