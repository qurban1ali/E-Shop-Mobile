import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OnboardingScreen = () => {
    const handleGetStarted = () => {
        router.replace("/login")
    }
  return (
    <View style={styles.container}>
          <Image
          source={{uri:"https://img.freepik.com/premium-photo/woman-holds-stack-paper-bags-red-background-shopping-concept-close-up_1048944-22455782.jpg?semt=ais_hybrid&w=740&q=80"}} 
          style={styles.backgroundImage}
          />

          {/* overlay gradient for better text visibility */}
          <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
          />
          <View style={styles.contentContainer}>
             <Text style={styles.title}>Welcome to EShop</Text>
             <Text style={styles.subtitle}>Discover amazing products and shop with ease</Text>
             <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                 <LinearGradient colors={["#FF6B6B", "#4A66F0"]}
                 start={{x:0, y:0}}
                 end={{x:1, y:0}}
                 style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>Get Started</Text>
                 </LinearGradient>
             </TouchableOpacity>
          </View>
    </View>
  )
 }




 const {width, height} = Dimensions.get('window')

  const styles = StyleSheet.create({
    container:{
        width:"100%",
        height:"100%"
    },
    backgroundImage:{
     width,
     height,
     position: "absolute",
     top:0,
     left:0,
      resizeMode:"cover"
    },
    overlay:{
      position:"absolute",
      right:0,
      left:0,
      bottom:0,
      height:height * 0.6
    },
    contentContainer:{
        flex:1,
        justifyContent: "flex-end",
        alignItems:"center",
        paddingBottom:50,
        paddingHorizontal:20
    },
    title:{
        fontSize:32,
        fontWeight:"bold",
        color:"#FFFFFF",
        marginBottom:10,
        textAlign:"center"
    },
    subtitle:{
        fontSize:16,
        color:"#FFFFFF",
        marginBottom:30,
        textAlign:"center",
        opacity:0.8
    },
    button:{
        width:"100%",
        marginTop:20,
        borderRadius: 10,
        overflow:"hidden"
    },
    buttonText:{
        color:'#FFFFFF',
        fontSize:18,
        fontWeight:'bold'
    },
    buttonGradient:{
        paddingVertical:15,
        alignItems:'center',
        justifyContent:'center'
    }
  })


  export default OnboardingScreen;
