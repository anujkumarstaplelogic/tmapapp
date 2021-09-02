import React, {Component } from 'react';
import { View, Text, Image,StyleSheet,TouchableOpacity,ScrollView,Alert,SafeAreaView} from 'react-native';
import { Container, Header, Content, Form, Item, Input, Label,Button, Toast, Icon, ListItem, CheckBox, Body,Switch } from 'native-base';
import { image, config, _showErrorMessage, _showSuccessMessage, Loader, _storeUser,_getAll, _storeData, _retrieveData } from 'assets';
import styles from './styles';
import ImagePicker from 'react-native-image-picker';
import {getUser, submitHelperInformation,postData } from 'api';
import CustomHeader from '../../CustomHeader';
import { flashon, flashoff } from '../../../store/actions/index.js';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import { WebView } from 'react-native-webview';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
class HelperInformation extends Component {
constructor(props) {
    super(props);
 
    this.state = {
      isloading: false,
      helper_first_name:'',
      helper_last_name:'',
      is_exception_case:false,
      uniform_pics:'',
      radiocheck:1, 
      radio_props : [ 
    {label: 'Yes', value: 0 }, 
    {label: 'No', value: 1 }
  ],
      vehicleInfo: this.props?.route?.params?.vehicleInfo,
      is_verify:false,
      full_name:null,
      profile_photo:null,
      SecurityCode:null,
      isShowScanner: false
    };

    // this.props.navigation.navigate('Inspection', { vehicleInfo: this.props?.route?.params?.vehicleInfo})

    
  }
  
    componentDidMount = () => {
      this._unsubscribe = this.props.navigation.addListener('focus', () => {
           getUser().then((res) => {
            this.setState({
              SecurityCode: res.SecurityCode
            });
          }); 
       }); 
    };
 
  componentWillUnmount() {
    this._unsubscribe();
  }  
    
  removeImage(_state) {
    this.setState({ [_state]: false});
  }

  
 

    checkCode = () => {
    this.setState({ isloading: true });
    var postdata = { 'security_code':this.state.barcodes,'verify_by':'driver'};
     console.log(postdata);
     postData(postdata,'verify_security_code').then((res) => {
      console.log(res);
      if(res.type == 1) {
            this.setState({isloading: false,is_verify:true,profile_photo:res.data.profile_photo,full_name:res.data.full_name });
          _showSuccessMessage(res.message);
      } else {
         this.setState({ is_verify:false,isloading: false});
        _showErrorMessage(res.message);
      }
    });
  }

  clearData = () => {

    Alert.alert(
            "Continue",
            "Are you sure reset helper information & selfie photo?",
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
              },
              { text: "Yes", onPress: () => {
                  
                  this.setState({
                          uniform_pics:'',
                          radiocheck: 0,
                          helper_first_name: '',
                          helper_last_name: '',
                  })
                    
                  } 
              }
            ],
            { cancelable: false }
          );
  }
  saveData = () => {

  if(this.state.radiocheck == 0){
    if(this.state.uniform_pics == null){
       
        _showErrorMessage('Please take a photo with uniform');
            
            return false;
      } 

      else if(!this.state.is_verify){
        
          _showErrorMessage('Please verify driver code first');
            
            return false;
      }
      
      else{
          
          const formdata = new FormData();
          formdata.append('first_name', this.state.helper_first_name);
          formdata.append('last_name', this.state.helper_last_name);
          formdata.append('do_you_have_helper', 'yes');

          let uri = this.state.uniform_pics;
          if(uri) {
            let filename = uri.substring(uri.lastIndexOf('/') + 1, uri.length)
            let image = {
              uri:  uri,
              name: filename,
              type: "image/png",
            };
            console.log(image);
           formdata.append('selfie_photo', image);
          } else {
            _showErrorMessage('Please take a photo with uniform');
            return false;
          }

          this.setState({isloading:true}); 

          submitHelperInformation(formdata).then((res) => {
           setTimeout(() => {this.setState({isloading: false})}, 1000)
               if(res.type == 1) {
                   this.props.navigation.navigate('Inspection', { vehicleInfo: this.props?.route?.params?.vehicleInfo})
              } else {
                
                _showErrorMessage(res.message);
                
              } 
              

          }).catch(function (error) {
            console.log(error);
            _showErrorMessage(error.message);
                      
          });  

      }
    }
    else{
     
      if(this.state.uniform_pics == ''){

        _showErrorMessage('Please take a photo with uniform');
           
            return false;
      }
      else{
          this.setState({isloading:true});
          const formdata = new FormData();


          let uri = this.state.uniform_pics;
          if(uri) {
            let filename = uri.substring(uri.lastIndexOf('/') + 1, uri.length)
            let image = {
              uri:  uri,
              name: filename,
              type: "image/png",
            };
            console.log(image);
           formdata.append('selfie_photo', image);
          } else {
            _showErrorMessage('Please take a photo with uniform');
            return false;
          }   
         
          formdata.append('do_you_have_helper', 'no');
          
          console.log(formdata);
        
          submitHelperInformation(formdata).then((res) => {
            setTimeout(() => {this.setState({isloading: false})}, 1000)
              console.log(res);
               if(res.type == 1) {

                   this.props.navigation.navigate('Inspection', { vehicleInfo: this.props?.route?.params?.vehicleInfo})
              } else {
                 _showErrorMessage(res.message);
              }
          }).catch(function (error) {
            console.log(error);
            this.setState({ isloading: false });
            _showErrorMessage(error.message);
                       
          });
          
      }

    }

  };

    takePhoto = () => {
        const options = {
          title: 'Uniform Pic',
          mediaType: 'photo',
          maxWidth:500,
          maxHeight:500
        };
        ImagePicker.launchCamera(options, response => {
          if (response.uri) {
            this.setState({ uniform_pics: response.uri});
          }
        });
   }

    removePlaceImage() {
    this.setState({ uniform_pics: null});
  }

   refreshPage() {
    this.props.navigation.push('HelperInformation');
  }

    onScannerSuccess = e => {
    const { data } = e;
      this.setState({
          barcodes: '',
          isloading: true
        }, () => {
            if (data) {
              
              this.setState({ isloading: true });
              var postdata = { 'security_code':String(data),'verify_by':'driver'};
                postData(postdata,'verify_security_code').then((res) => {
              
                if(res.type == 1) {
                      this.setState({barcodes:String(data),isloading: false,is_verify:true,profile_photo:res.data.profile_photo,full_name:res.data.full_name,isShowScanner: false });
                    _showSuccessMessage(res.message);
                } else {
                   this.setState({ is_verify:false,isloading: false,isShowScanner: false});
                  _showErrorMessage(res.message);
                }
              });

            } else {
                this.setState({ isloading: false });
                  Alert.alert(
                'Invalid QR Code',
                'This QR code is not tmapapp code.',
                [
                  { text: 'OK', onPress: () => console.log('OK Pressed') },
                ],
                { cancelable: false },
              );
            }
        })
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

    const {isShowScanner,is_verify,profile_photo,full_name,SecurityCode} = this.state;
     
    return (
      
      <Container>
        <Content>
          <CustomHeader {...this.props} url={this.state.user_avtar} />
          
          <View style={backSection}>
              <TouchableOpacity style={backButton} onPress={() => this.setState({isShowScanner:false})}>
              <Icon type="FontAwesome" name='angle-left' style={backIcon}/>
                <Text style={{color:"#fff",fontWeight:'bold',marginTop:(Platform.OS == 'ios') ? 5 : 0, fontSize: 20,padding:10,textAlign:'center',paddingLeft:'4%'}}>Helper & Selfie Photo</Text>
              </TouchableOpacity>
               <TouchableOpacity onPress={() => this.refreshPage()}>
            <Icon style={{color:'#fff',right:8,fontWeight:200}} name='sync' />
          </TouchableOpacity>
          </View>
          { (this.state.isShowScanner) &&
              <View>
                <View style={{flexDirection:'row', justifyContent:'space-between',marginLeft: 20, marginRight: 20}}>
                  <Text style={{color:'black',fontSize:18,}}>Flash Light</Text>
                  <Switch onValueChange={ (value) => {value == true?this.props.flashon():this.props.flashoff()}} 
                    value={this.props.flashstatus == 'torch'?true:false} /> 
                </View>
                <View>
                <QRCodeScanner
              cameraStyle={{ height: 280, marginTop: 10, width: 300, alignSelf: 'center', justifyContent: 'center', overflow: 'hidden' }}
              onRead={ (e) => this.onScannerSuccess(e) }
                reactivate={true}
                showMarker={true}
                flashMode={this.props.flashstatus == 'torch'?RNCamera.Constants.FlashMode.torch:RNCamera.Constants.FlashMode.off}
                reactivateTimeout={7000}
            />
              </View>
            </View> 
            }
             { (!this.state.isShowScanner) &&
        <View style={{paddingLeft:10,paddingRight:10}}>
          <View style={{ borderRadius: 15,alignItems: 'center',justifyContent:'center',marginTop:15}}>
              <Button small onPress={() => this.takePhoto()}  style={{backgroundColor: '#00c2f3',width:'99%',alignSelf:'center',alignItems:'center',justifyContent:'center'}}>
              <Text style={{color:'#fff',fontWeight:'bold', fontSize: 14,textAlign:'center',alignSelf:'center'}}>Take your selfie with uniform</Text>
              <Icon name='camera' />
              </Button>
          </View>
          <View style={{flexDirection:'row',width:'100%',justifyContent: 'center',marginTop: 10}}>

          {this.state.uniform_pics ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', flexGrow: 0, justifyContent: 'flex-start',marginTop: 10 }}>
              <View style={{ flexBasis: '100%', height: 170 }}>
                {this.state.uniform_pics ? (<Image style={{ height: 170 }} source={{ uri: this.state.uniform_pics }}/>):null}
                {this.state.uniform_pics ? (<TouchableOpacity onPress={() => this.removePlaceImage()}
                                  style={{ position: 'absolute', top: 2, right: 5, zIndex: 9 }}>
                  <Icon type="FontAwesome" name='times'  style={{ color: 'red'}}/>
                </TouchableOpacity>):null}
              </View>
            </View>):null}
          </View>
          <View> 
          <View style={{flexDirection:'row',width:'100%',justifyContent: 'center',marginTop: 20}}>
          <Text style={{ color: '#000', fontSize: 20}}>Do you have helper ?</Text>
           </View>
          <View style={{flexDirection:'row',width:'100%',justifyContent: 'center',marginTop: 20}}>

          <CheckBox onPress={() => this.setState({radiocheck:0 })} style={{left:5, width: 30,height: 30, borderWidth:10,borderRadius:200,backgroundColor:this.state.radiocheck === 0?"#00c2f3":"#fff"}} />
            <Text style={{fontSize: 18,marginTop:5,marginLeft:10}}>Yes</Text>
             <View style={{marginLeft: 12}}></View>
            <CheckBox onPress={() => this.setState({radiocheck:1 })} style={{left:5,width: 30,height: 30,borderWidth:10,borderRadius:200,backgroundColor:this.state.radiocheck === 1?"#00c2f3":"#fff"}}/>
            <Text style={{fontSize: 18,marginTop:5,marginLeft:10}}>No</Text> 
          </View> 
          {this.state.radiocheck == 0 && 
              <View>
              <View style={{ borderRadius: 15,alignItems: 'center',justifyContent:'center',marginTop:15}}>
                <Button small onPress={() => this.setState({isShowScanner:true})} style={{backgroundColor: '#00c2f3',width:'99%',alignSelf:'center',alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:'#fff',fontWeight:'bold', fontSize: 14,textAlign:'center',alignSelf:'center'}}>SCAN HELPER QR CODE</Text>
                <Icon name='scan' />
                </Button>
              </View>
              <View style={{ marginTop: 3, alignItems:'center'}}>
                 <Text style={{ textAlign: 'center', fontSize: 14}}>OR</Text>
              </View>    
              <Form>
                  <Item stackedLabel>
                    <Label error={true} style={{ fontWeight: 'bold' }}>Enter 6 Digit Helper Code</Label>
                  <Item>
                        <Input disabled={is_verify?true:false} placeholder="Enter 6 Digit Helper Code" value={this.state.barcodes} onChangeText={(barcodes) => this.setState({ barcodes: barcodes })}/>
                        
                    {is_verify?(<Icon type="FontAwesome" name='check' style={{ color: 'green'}} />):<TouchableOpacity onPress={() => this.checkCode()}><Text style={{ textAlign: 'center', color:'#054b8b', fontSize: 14}}>VERIFY</Text></TouchableOpacity>}
                  
                  </Item>
                </Item>
              </Form>
              {is_verify?(<View>
                <Text style={{fontWeight:'bold',fontSize:18,alignSelf:'center',justifyContent:'center',marginTop:5}}>YOUR HELPER DETAILS</Text>
                <View style={{alignItems:'center',justifyContent:'center',alignSelf:'center'}}>
                <Image
        style={{ marginTop:10,height: 70,width: 70,borderRadius: 40,borderColor:'grey',borderWidth:1}}
        source={{ uri: profile_photo }}
      />
              <Text style={{alignSelf:'center',marginTop:10,fontSize:18,fontWeight:'bold'}}>{full_name}</Text>
      </View>
      <View style={{borderWidth:0.5,borderColor:'black',marginTop:10}}></View>
      <Text style={{fontWeight:'bold',fontSize:18,alignSelf:'center',justifyContent:'center',marginTop:5}}>YOUR QR CODE</Text>
      <WebView style={{height:200,width:200,justifyContent:'center',alignSelf:'center'}} source={{ uri: 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl='+SecurityCode+'' }} />
              <Text style={{ textAlign: 'center', fontSize: 18, fontWeight:'bold'}}>{SecurityCode}</Text>
              </View>):null}
              </View>
        }
          <View style={{ flexDirection: 'row', marginTop: 15,marginBottom: 35,justifyContent:'space-between'}}>
              <Button style={{ height: 50, width:'48%',marginTop: 20, backgroundColor: '#00c2f3', justifyContent: 'center', borderRadius: 5}}
                    onPress={() => this.saveData()} disabled={this.state.isloading?true:false}>
                    <Text style={{ textAlign: 'center', color: '#fff', fontSize: 22 }}>Submit</Text>
              </Button>
             
              <Button style={{ height: 50, width:'48%',marginTop: 20, backgroundColor: 'white', borderColor:'#00c2f3', borderWidth:1, justifyContent: 'center', borderRadius: 5}}
                    onPress={() => this.clearData()}>
                    <Text style={{ textAlign: 'center', color: 'black', fontSize: 22 }}>Cancel</Text>
              </Button>
          </View>
          </View>
          </View>}
          </Content>
        {this.state.isloading && (
              <Loader />
          )}
        </Container>
        


    );
  }
}

function mapStateToProps(state){
  return{
    flashstatus : state.flashstatus
  };
}
function matchDispatchToProps(dispatch){
  return bindActionCreators({flashon: flashon, flashoff: flashoff}, dispatch)
}
export default connect(mapStateToProps,matchDispatchToProps)(HelperInformation);