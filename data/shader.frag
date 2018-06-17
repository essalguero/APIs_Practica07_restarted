varying vec3 N;
varying vec4 vertexObserver;

varying vec2 fTexture;
uniform bool isTexturized;
uniform bool hasColor;
uniform sampler2D texSampler;
uniform vec4 color;

const int MAX_LIGHTS = 8;

uniform int numberLights;
uniform vec4 diffuse;
uniform int shininess;
uniform vec3 ambientLight;

struct LightInfo                                                           
{  
	vec4 lightColor;
	float linearAttenuation;

	vec4 lightVector;
};
uniform LightInfo lights[MAX_LIGHTS];

struct LightComponents
{
	vec4 diffuseComponent;
	vec4 specularComponent;
};


LightComponents calculateLight(int i)
{

	LightComponents currentLight;

	vec4 diffuseComponent = vec4(ambientLight, 1.0);
	vec4 specularComponent = vec4(0.0, 0.0, 0.0, 1.0);
	float NdotL;

	vec3 normalizedN = normalize(N);

	vec3 L = lights[i].lightVector.xyz;

	float attenuationFactor = 1.0;

	if (lights[i].lightVector.w == 1.0)
	{
		L = L - vertexObserver.xyz;
		attenuationFactor = 1.0 / (1.0 + (lights[i].linearAttenuation * length(L)));
	}

	L = normalize(L);
	NdotL = max(dot(normalizedN, L), 0.0);

	diffuseComponent += NdotL * lights[i].lightColor * attenuationFactor;

	if ((shininess > 0) && (NdotL > 0.0))
	{
		vec4 vertexObserverNorm = normalize(vertexObserver);
		vec3 H = L - vertexObserverNorm.xyz;
		H = normalize(H);
		
		float NdotH = max(dot(normalizedN, H), 0.0);

		specularComponent += pow(NdotH, float(shininess)) * attenuationFactor;
	}

	currentLight.diffuseComponent = diffuseComponent;
	currentLight.specularComponent = specularComponent;

	return currentLight;
}


void main()
{
	vec4 diffuseComponent = vec4(0, 0, 0, 1);
	vec4 specularComponent = vec4(0, 0, 0, 1);
	LightComponents currentLight; 

	if (numberLights > 0)
	{
		vec4 totalIlumination = vec4(0, 0, 0, 1.0);

		for (int i = 0; i < numberLights; ++i)
		{
			currentLight = calculateLight(i);
			
			specularComponent += currentLight.specularComponent;
			diffuseComponent += currentLight.diffuseComponent;
			
		}

		if (hasColor)
		{
			if (isTexturized)
			{
				gl_FragColor = (diffuseComponent * color * texture2D(texSampler, fTexture)) + specularComponent;
				//gl_FragColor = color;
			}
			else
			{
				gl_FragColor = (diffuseComponent * color) + specularComponent;
			}
		}
	}
	else
	{
		if (isTexturized)
		{
			gl_FragColor = diffuse * texture2D(texSampler, fTexture);
			//gl_FragColor = color;
		}
		else
		{
			gl_FragColor = color;
		}
	}

	/*if (hasColor)
	{
		gl_FragColor = vec4(N, 1);
	}
	else
	{
		gl_FragColor = vec4(1.0);
	}*/
}