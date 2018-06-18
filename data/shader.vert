//varying vec3 fcolor;
varying vec3 N;
varying vec4 vertexObserver;

attribute vec3 vpos;
attribute vec2 vTexture;
uniform mat4 mvpMatrix;

varying vec2 fTexture;

attribute vec3 vnormal;
uniform mat4 mvMatrix;
uniform mat4 normalsMatrix;

attribute vec3 vtangent;

varying mat3 tbn;

uniform bool hasNormalTexture;
uniform bool hasRefractionTexture;
uniform bool hasReflectionTexture;

varying vec3 uvw;
attribute float refractionCoef;
uniform vec3 eyePos;
uniform mat4 ModelMatrix;

void main() {
	gl_Position = mvpMatrix * vec4(vpos, 1);
	vec4 tempN = normalsMatrix * vec4(vnormal, 1);
	N = tempN.xyz;

	vertexObserver = mvMatrix * vec4(vpos, 1);
	
	fTexture = vTexture;
	
	// Calculos para normal mapping
	// Obtenido anteriormente en tempN
	//vec4 normalVector = normalsMatrix * vec4(vnormal, 1);

	//tangent vector
	vec4 tangentVector = normalsMatrix * vec4(vtangent, 1);

	vec3 bitangent = cross(tempN.xyz, tangentVector.xyz);

	tbn = transpose(mat3(tangentVector.xyz, bitangent.xyz, tempN.xyz));


	// Cubemapping
	vec3 eye = normalize(vec3(ModelMatrix * vec4(vpos, 1)) - eyePos);
	vec3 normal = vec3(ModelMatrix * vec4(vnormal, 0));

	if (hasRefractionTexture)
	{
		uvw = normalize(refract(eye, normal, refractionCoef));
		uvw = normalize(vpos);
	}
	else if (hasReflectionTexture)
	{
		uvw = normalize(reflect(eye, normal));
		uvw = normalize(vpos);
	}
	else 
	{
		uvw = normalize(vpos);
	}


}